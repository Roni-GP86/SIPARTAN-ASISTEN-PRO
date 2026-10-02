import { GoogleFormConfig, AccessRecord } from '../types';
import {
  getAllAccessRecords,
  saveAllAccessRecords,
  generateUniqueAccessCode,
  GOOGLE_FORM_CONFIG_STORAGE_KEY,
} from './accessCodeService';

export function getSavedGoogleFormConfig(): GoogleFormConfig | null {
  try {
    const raw = localStorage.getItem(GOOGLE_FORM_CONFIG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveGoogleFormConfig(config: GoogleFormConfig): void {
  try {
    localStorage.setItem(GOOGLE_FORM_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Gagal menyimpan Google Form config:', e);
  }
}

/**
 * Membuat Google Form Pendaftaran Guru SIPARTAN secara otomatis
 * melalui Google Forms API menggunakan Access Token OAuth pemilik formulir.
 */
export async function createSipartanRegistrationForm(
  accessToken: string
): Promise<GoogleFormConfig> {
  // Step 1: Create empty form
  const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: {
        title: 'Formulir Pendaftaran & Aktivasi Akses SIPARTAN',
        documentTitle: 'Formulir Pendaftaran Guru SIPARTAN',
      },
    }),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(
      errData.error?.message ||
        `Gagal membuat formulir di Google Forms (HTTP ${createRes.status}). Pastikan Anda telah memberikan izin Forms API.`
    );
  }

  const formData = await createRes.json();
  const formId = formData.formId;
  const responderUri = formData.responderUri;

  // Step 2: Add the 7 structured questions in precise order
  // 1. Nama Lengkap Guru
  // 2. NIP Guru
  // 3. Jabatan Guru (Guru Kelas / Guru Mata Pelajaran)
  // 4. Nama Satuan Pendidikan (Sekolah)
  // 5. Fase & Kelas (Fase A, Fase B, Fase C)
  // 6. Nama Kepala Sekolah
  // 7. NIP Kepala Sekolah
  const batchRequests = [
    {
      createItem: {
        item: {
          title: '1. Nama Lengkap Guru (beserta Gelar)',
          description: 'Contoh: Yeni Ellu, S.Pd. atau Roni Hariyanto Bhidju, S. Pd',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 0 },
      },
    },
    {
      createItem: {
        item: {
          title: '2. NIP Guru',
          description: 'Ketik 18 digit NIP tanpa spasi/titik, atau ketik tanda hubung (-) jika Non-PNS/PPPK',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 1 },
      },
    },
    {
      createItem: {
        item: {
          title: '3. Jabatan Guru',
          description: 'Pilih tugas penugasan Anda di satuan pendidikan',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Guru Kelas' },
                  { value: 'Guru Mata Pelajaran' },
                ],
              },
            },
          },
        },
        location: { index: 2 },
      },
    },
    {
      createItem: {
        item: {
          title: '4. Nama Satuan Pendidikan (Nama Sekolah)',
          description: 'Contoh: UPT SD Negeri 1 Silaut atau SD Negeri Fatubai',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 3 },
      },
    },
    {
      createItem: {
        item: {
          title: '5. Fase dan Pilihan Kelas',
          description: 'Pilih jenjang fase dan tingkatan kelas yang diampu',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: [
                  { value: 'Fase C (Kelas 5 & 6)' },
                  { value: 'Fase B (Kelas 3 & 4)' },
                  { value: 'Fase A (Kelas 1 & 2)' },
                ],
              },
            },
          },
        },
        location: { index: 4 },
      },
    },
    {
      createItem: {
        item: {
          title: '6. Nama Kepala Sekolah (beserta Gelar)',
          description: 'Contoh: Darius Kusi, S.Pd. atau Gusmardi, S.Pd.',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 5 },
      },
    },
    {
      createItem: {
        item: {
          title: '7. NIP Kepala Sekolah',
          description: 'Ketik 18 digit NIP Kepala Sekolah, atau tanda hubung (-) jika belum ber-NIP',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 6 },
      },
    },
  ];

  try {
    await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: batchRequests }),
    });
  } catch (err) {
    console.warn('Batch update question failed, continuing with base form:', err);
  }

  const config: GoogleFormConfig = {
    formId,
    formUrl: `https://docs.google.com/forms/d/${formId}/edit`,
    responderUrl: responderUri || `https://docs.google.com/forms/d/e/${formId}/viewform`,
    title: 'Formulir Pendaftaran & Aktivasi Akses SIPARTAN',
    lastSyncedAt: new Date().toISOString(),
    totalResponses: 0,
  };

  saveGoogleFormConfig(config);
  return config;
}

/**
 * Sinkronisasi respon dari Google Form yang sudah dibuat/ditautkan.
 * Otomatis menerbitkan kode akses GP-XXXX untuk setiap pendaftar baru!
 */
export async function syncGoogleFormResponses(
  accessToken: string,
  formId: string
): Promise<{ added: number; total: number; formTitle: string }> {
  // 1. Fetch form metadata to get question titles and questionIds
  const formRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!formRes.ok) {
    const err = await formRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal mengakses Google Form ID: ${formId}`);
  }

  const formData = await formRes.json();
  const formTitle = formData.info?.title || 'Formulir Pendaftaran SIPARTAN';

  // Map questionId to title
  const questionMap: Record<string, string> = {};
  if (Array.isArray(formData.items)) {
    formData.items.forEach((item: any) => {
      if (item.questionItem?.question?.questionId) {
        questionMap[item.questionItem.question.questionId] = (item.title || '').toLowerCase();
      }
    });
  }

  // 2. Fetch responses
  const responsesRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!responsesRes.ok) {
    const err = await responsesRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal membaca respon Google Form.');
  }

  const respData = await responsesRes.json();
  const responses: any[] = respData.responses || [];

  const existingRecords = getAllAccessRecords();
  let addedCount = 0;

  responses.forEach((resp) => {
    const responseId = resp.responseId;
    // Check if this responseId is already recorded
    const alreadyExists = existingRecords.some((r) => r.id === `gform-${responseId}`);
    if (alreadyExists) return;

    // Parse answers
    let namaGuru = '';
    let nipGuru = '-';
    let jabatan: 'Guru Kelas' | 'Guru Mata Pelajaran' = 'Guru Kelas';
    let namaSekolah = '';
    let fase: 'Fase A' | 'Fase B' | 'Fase C' = 'Fase C';
    let kelas = '5 & 6';
    let namaKepalaSekolah = '-';
    let nipKepalaSekolah = '-';

    const answersObj = resp.answers || {};
    Object.keys(answersObj).forEach((qId) => {
      const qTitle = questionMap[qId] || '';
      const textVal = answersObj[qId]?.textAnswers?.answers?.[0]?.value || '';

      if (qTitle.includes('nama lengkap') || qTitle.includes('nama guru') || qTitle.startsWith('1.')) {
        namaGuru = textVal;
      } else if (qTitle.includes('nip guru') || qTitle.startsWith('2.')) {
        nipGuru = textVal || '-';
      } else if (qTitle.includes('jabatan') || qTitle.startsWith('3.')) {
        if (textVal.toLowerCase().includes('mata pelajaran') || textVal.toLowerCase().includes('mapel')) {
          jabatan = 'Guru Mata Pelajaran';
        } else {
          jabatan = 'Guru Kelas';
        }
      } else if (qTitle.includes('sekolah') || qTitle.includes('satuan pendidikan') || qTitle.startsWith('4.')) {
        namaSekolah = textVal;
      } else if (qTitle.includes('fase') || qTitle.includes('kelas') || qTitle.startsWith('5.')) {
        if (textVal.includes('Fase A') || textVal.includes('Kelas 1')) {
          fase = 'Fase A';
          kelas = '1 & 2';
        } else if (textVal.includes('Fase B') || textVal.includes('Kelas 3') || textVal.includes('Kelas 4')) {
          fase = 'Fase B';
          kelas = '3 & 4';
        } else {
          fase = 'Fase C';
          kelas = '5 & 6';
        }
      } else if (qTitle.includes('nama kepala') || qTitle.startsWith('6.')) {
        namaKepalaSekolah = textVal || '-';
      } else if (qTitle.includes('nip kepala') || qTitle.startsWith('7.')) {
        nipKepalaSekolah = textVal || '-';
      }
    });

    if (namaGuru.trim() && namaSekolah.trim()) {
      const kodeAkses = generateUniqueAccessCode(existingRecords);
      const newRec: AccessRecord = {
        id: `gform-${responseId}`,
        kodeAkses,
        isActive: true, // Otomatis aktif saat disinkronisasi oleh pemilik formulir
        isPremiumMaster: false,
        tanggalDibuat: resp.createTime || new Date().toISOString(),
        tanggalAktivasi: new Date().toISOString(),
        namaGuru: namaGuru.trim(),
        nipGuru: nipGuru.trim() || '-',
        jabatan,
        namaSekolah: namaSekolah.trim(),
        fase,
        kelas,
        mataPelajaran: 'Matematika',
        namaKepalaSekolah: namaKepalaSekolah.trim() || '-',
        nipKepalaSekolah: nipKepalaSekolah.trim() || '-',
        emailPendaftar: resp.respondentEmail,
        sumberPendaftaran: 'Google Form',
        catatanStatus: 'Pendaftaran otomatis tersinkronisasi dari Google Form',
      };
      existingRecords.push(newRec);
      addedCount++;
    }
  });

  if (addedCount > 0) {
    saveAllAccessRecords(existingRecords);
  }

  // Update config
  const existingConfig: GoogleFormConfig = getSavedGoogleFormConfig() || {
    formId,
    formUrl: `https://docs.google.com/forms/d/${formId}/edit`,
    responderUrl: `https://docs.google.com/forms/d/e/${formId}/viewform`,
    title: formTitle,
  };
  existingConfig.lastSyncedAt = new Date().toISOString();
  existingConfig.totalResponses = responses.length;
  saveGoogleFormConfig(existingConfig);

  return { added: addedCount, total: responses.length, formTitle };
}
