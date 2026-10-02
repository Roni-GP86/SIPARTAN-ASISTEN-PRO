import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SchoolIdentity, TPItem, RPMConfigOptions, BedahElemenRow, ATPDocument } from '../types';
import { distributeJPPerMeeting } from '../utils/rpmUtils';
import { resolveCPPerElemenFromTPs, findOfficialElementCP } from '../utils/curriculumCPResolver';
import { getClassesForFase, filterTPListByClass, getItemClass } from '../utils/classFilterUtils';
import { OFFICIAL_SUBJECT_FOLDERS } from '../data/officialCPDatabase';
import { getSubjectEmoticon } from '../utils/subjectWorkspaceService';
import { 
  X, Sparkles, Check, Plus, Trash2, Users, Laptop, BookOpen, 
  Layers, Compass, School, Award, AlertCircle, AlertTriangle, Eye, EyeOff, Filter,
  User, Building, Calendar, CheckSquare, Square, ChevronDown, ChevronUp,
  FileText, ArrowRight, ArrowLeft, CheckCircle2, Edit2
} from 'lucide-react';

interface RPMConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  identitas: SchoolIdentity;
  tpList: TPItem[];
  elemenRows?: BedahElemenRow[];
  atpDocument?: ATPDocument | null;
  defaultSelectedTPCodes?: string[];
  initialOptions?: Partial<RPMConfigOptions>;
  onConfirm: (options: RPMConfigOptions) => void;
  isLoading?: boolean;
  onUpdateIdentitas?: (updated: SchoolIdentity) => void;
  onGoToCPInput?: () => void;
  onOpenSubjectPicker?: () => void;
}

const PRESET_METODE = [
  'Diskusi Kelompok',
  'Tanya Jawab Interaktif',
  'Eksplorasi Kontekstual',
  'Praktik Langsung / Eksperimen',
  'Demonstrasi Benda Konkret',
  'Penugasan Mandiri / Kelompok',
  'Presentasi Apresiatif',
  'Simulasi & Permainan Edukatif',
];

const PRESET_MITRA_INTERNAL = [
  'Guru Kelas / Guru Mata Pelajaran',
  'Murid (Tutor Sebaya)',
  'Rekan Sejawat Guru',
  'Tenaga Kependidikan',
  'Konselor / Guru BK',
];

const PRESET_MITRA_EKSTERNAL = [
  'Orang Tua / Wali Murid',
  'Komunitas Lingkungan Sekitar Sekolah',
  'Tokoh Masyarakat / Tetua Adat',
  'Praktisi / Narasumber Ahli',
  'Dunia Usaha / UMKM Lokal',
];

const PRESET_PLATFORM = [
  'Video Pembelajaran / YouTube',
  'Slide Interaktif / Canva',
  'Quizizz',
  'Google Classroom',
  'Rumah Belajar Kemdikbud',
];

const PRESET_PERANGKAT = [
  'Laptop / Komputer',
  'LCD Proyektor',
  'Smartphone / Android',
  'Audio Speaker',
  'Papan Tulis Interaktif',
];

const PRESET_MEDIA = [
  'Video Pembelajaran Kontekstual',
  'Slide Presentasi Bergambar',
  'Infografis Edukatif',
  'Audio Suara Alam / Narasi',
  'Lembar Kerja Interaktif',
];

const PRESET_LINGKUNGAN_FISIK = [
  'Ruang Kelas Fleksibel Berkelompok',
  'Pojok Baca / Perpustakaan',
  'Halaman Sekolah / Alam Terbuka',
  'Laboratorium Komputer / IPA',
];

const PRESET_BUDAYA_BELAJAR = [
  'Disiplin Waktu & Tanggung Jawab',
  'Gotong Royong & Kerja Sama',
  'Saling Menghargai & Inklusif',
  'Rasa Ingin Tahu Tinggi & Berani Bertanya',
  'Refleksi Diri yang Terbiasa',
];

const PRESET_KARAKTERISTIK_MURID = [
  'Rasa ingin tahu tinggi',
  'Suka belajar konkret & manipulatif',
  'Aktif secara fisik (kinestetik)',
  'Senang belajar secara berkelompok',
  'Beragam latar belakang kognitif',
];

const PRESET_DPL = [
  'Keimanan dan Ketakwaan terhadap Tuhan YME',
  'Kewargaan',
  'Penalaran Kritis',
  'Kreativitas',
  'Kolaborasi',
  'Kemandirian',
  'Kesehatan',
  'Komunikasi',
];

export const RPMConfigModal: React.FC<RPMConfigModalProps> = ({
  isOpen,
  onClose,
  identitas,
  tpList,
  elemenRows,
  atpDocument,
  defaultSelectedTPCodes = [],
  initialOptions,
  onConfirm,
  isLoading = false,
  onUpdateIdentitas,
  onGoToCPInput,
  onOpenSubjectPicker,
}) => {
  // Identity Form State
  const [schoolName, setSchoolName] = useState(identitas.namaSatuanPendidikan || 'SD Negeri Fatubai');
  const [guruName, setGuruName] = useState(identitas.namaGuru || 'Roni Hariyanto Bhidju, S. Pd');
  const [nipGuru, setNipGuru] = useState(identitas.nipGuru || '');
  const [peranGuru, setPeranGuru] = useState<'Guru Kelas' | 'Guru Mata Pelajaran'>(
    (identitas.peranGuru as any) || 'Guru Kelas'
  );
  const [kepalaSekolah, setKepalaSekolah] = useState(identitas.namaKepalaSekolah || 'Darius Kusi, S.Pd.');
  const [nipKepalaSekolah, setNipKepalaSekolah] = useState(identitas.nipKepalaSekolah || '196709192008011008');
  const [isIdentityExpanded, setIsIdentityExpanded] = useState(false);

  // Sync state if identitas prop changes
  useEffect(() => {
    if (identitas.namaSatuanPendidikan) setSchoolName(identitas.namaSatuanPendidikan);
    if (identitas.namaGuru) setGuruName(identitas.namaGuru);
    if (identitas.nipGuru) setNipGuru(identitas.nipGuru);
    if (identitas.namaKepalaSekolah) setKepalaSekolah(identitas.namaKepalaSekolah);
    if (identitas.nipKepalaSekolah) setNipKepalaSekolah(identitas.nipKepalaSekolah);
    if (identitas.peranGuru) setPeranGuru(identitas.peranGuru as any);
  }, [identitas]);

  // Determine available classes for the given Fase (e.g. Fase C -> ['5', '6'])
  const possibleClasses = useMemo(() => getClassesForFase(identitas.fase), [identitas.fase]);

  // Initial class determination
  const initialKelas = () => {
    if (initialOptions?.selectedKelas && possibleClasses.includes(initialOptions.selectedKelas)) {
      return initialOptions.selectedKelas;
    }
    if (defaultSelectedTPCodes && defaultSelectedTPCodes.length > 0) {
      const matched = tpList.find((t) => defaultSelectedTPCodes.includes(t.kodeTP));
      if (matched) {
        const cls = getItemClass(matched, identitas.fase);
        if (possibleClasses.includes(cls)) return cls;
      }
    }
    const idClass = String(identitas.kelas || '').trim();
    if (possibleClasses.includes(idClass)) {
      return idClass;
    }
    return possibleClasses[0] || '5';
  };

  const [selectedKelas, setSelectedKelas] = useState<string>(initialKelas);

  // Available TPs filtered strictly by the selected class
  const availableTPsForClass = useMemo(() => {
    return filterTPListByClass(tpList, selectedKelas, identitas.fase);
  }, [tpList, selectedKelas, identitas.fase]);

  // Group available TPs by Elemen
  const tpsByElemen = useMemo(() => {
    const groups: { [elemen: string]: TPItem[] } = {};
    availableTPsForClass.forEach((tp) => {
      const el = (tp.elemen || 'Elemen Lainnya').trim();
      if (!groups[el]) groups[el] = [];
      groups[el].push(tp);
    });
    return groups;
  }, [availableTPsForClass]);

  // Comprehensive list of all official elements for this Subject and Phase (BSKAP 046/2025)
  const allSubjectElements = useMemo(() => {
    const cleanStr = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const list: Array<{ elemen: string; cp: string; deskripsi?: string }> = [];
    const seen = new Set<string>();

    // 1. Check Official Subject Folders
    const folder = OFFICIAL_SUBJECT_FOLDERS.find((f) => {
      const mapelMatch =
        cleanStr(f.mataPelajaran).includes(cleanStr(identitas.mataPelajaran)) ||
        cleanStr(identitas.mataPelajaran).includes(cleanStr(f.mataPelajaran));
      const faseMatch = cleanStr(f.fase) === cleanStr(identitas.fase);
      return mapelMatch && faseMatch;
    });

    if (folder && folder.elemenList) {
      for (const el of folder.elemenList) {
        const key = cleanStr(el.elemen);
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            elemen: el.elemen,
            cp: el.capaianPembelajaran,
            deskripsi: el.deskripsiSingkat,
          });
        }
      }
    }

    // 2. Elemen Rows from CP Analysis (if any)
    if (elemenRows && elemenRows.length > 0) {
      for (const r of elemenRows) {
        const key = cleanStr(r.elemen);
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            elemen: r.elemen,
            cp: r.kalimatCP || '',
            deskripsi: r.elemen,
          });
        }
      }
    }

    // 3. Elements present in tpList
    if (tpList && tpList.length > 0) {
      for (const t of tpList) {
        if (t.elemen) {
          const key = cleanStr(t.elemen);
          if (!seen.has(key)) {
            seen.add(key);
            const officialCP = findOfficialElementCP(t.elemen, identitas.mataPelajaran, identitas.fase);
            list.push({
              elemen: t.elemen,
              cp: officialCP || t.kalimatCP || '',
              deskripsi: t.elemen,
            });
          }
        }
      }
    }

    return list;
  }, [identitas.mataPelajaran, identitas.fase, elemenRows, tpList]);

  // Selected TPs - initialized from availableTPsForClass
  const [selectedTPs, setSelectedTPs] = useState<string[]>(() => {
    if (initialOptions?.selectedTPCodes && initialOptions.selectedTPCodes.length > 0) {
      const matchingCodes = initialOptions.selectedTPCodes.filter((code) =>
        availableTPsForClass.some((tp) => tp.kodeTP === code)
      );
      if (matchingCodes.length > 0) return matchingCodes;
    }
    if (defaultSelectedTPCodes && defaultSelectedTPCodes.length > 0) {
      const matchingCodes = defaultSelectedTPCodes.filter((code) =>
        availableTPsForClass.some((tp) => tp.kodeTP === code)
      );
      if (matchingCodes.length > 0) return [matchingCodes[0]];
    }
    return availableTPsForClass.length > 0 ? [availableTPsForClass[0].kodeTP] : [];
  });

  const [manualActiveElemen, setManualActiveElemen] = useState<string | null>(null);

  // Active element determination
  const activeElemen = useMemo(() => {
    if (manualActiveElemen) return manualActiveElemen;
    const activeSelectedTPObject = availableTPsForClass.find((t) => selectedTPs.includes(t.kodeTP)) || availableTPsForClass[0];
    if (activeSelectedTPObject?.elemen) return activeSelectedTPObject.elemen;
    if (allSubjectElements.length > 0) return allSubjectElements[0].elemen;
    return 'Elemen Pembelajaran';
  }, [manualActiveElemen, availableTPsForClass, selectedTPs, allSubjectElements]);

  // Dynamically resolve exact Element and full detailed Capaian Pembelajaran from selected TPs
  const cpResolution = useMemo(() => {
    const selectedTPObjects = availableTPsForClass.filter((tp) => selectedTPs.includes(tp.kodeTP));
    return resolveCPPerElemenFromTPs(selectedTPObjects, elemenRows, atpDocument, {
      ...identitas,
      kelas: selectedKelas,
    });
  }, [selectedTPs, availableTPsForClass, elemenRows, atpDocument, identitas, selectedKelas]);

  // Current active CP text
  const activeElementCPText = useMemo(() => {
    const act = (activeElemen || '').toLowerCase();
    if (cpResolution.perElemenList && cpResolution.perElemenList.length > 0) {
      const match = cpResolution.perElemenList.find(
        (p) => {
          const pEl = (p.elemen || '').toLowerCase();
          return (pEl && act && pEl.includes(act)) || (act && pEl && act.includes(pEl));
        }
      );
      if (match && match.capaianPembelajaran) return match.capaianPembelajaran;
    }
    const foundInAll = allSubjectElements.find(
      (e) => {
        const eEl = (e.elemen || '').toLowerCase();
        return (eEl && act && eEl.includes(act)) || (act && eEl && act.includes(eEl));
      }
    );
    if (foundInAll && foundInAll.cp) return foundInAll.cp;
    const official = findOfficialElementCP(activeElemen, identitas.mataPelajaran, identitas.fase);
    if (official) return official;

    return cpResolution.capaianPembelajaranFormatted || 'Peserta didik memahami konsep materi secara mendalam dan menerapkannya dalam memecahkan masalah kontekstual.';
  }, [activeElemen, cpResolution, allSubjectElements, identitas.mataPelajaran, identitas.fase]);

  // Handle Class Switch
  const handleSelectKelasChange = (newKelas: string) => {
    setSelectedKelas(newKelas);
    const newClassTPs = filterTPListByClass(tpList, newKelas, identitas.fase);
    if (newClassTPs.length > 0) {
      // If currently selected element has TPs in this new class, select first TP in that element
      const act = (activeElemen || '').toLowerCase();
      const tpsInSameElement = newClassTPs.filter((t) => {
        const tEl = (t.elemen || '').toLowerCase();
        return (tEl && act && tEl.includes(act)) || (act && tEl && act.includes(tEl));
      });
      const chosenTP = tpsInSameElement.length > 0 ? tpsInSameElement[0] : newClassTPs[0];
      setSelectedTPs([chosenTP.kodeTP]);
      setManualActiveElemen(chosenTP.elemen);
      const newTopic = chosenTP.lingkupMateri;
      setTopikMateri(newTopic);
      setKarakteristikMateri((prev) => {
        if (!prev || prev.includes('bersifat konseptual dan prosedural')) {
          return `Materi ${newTopic || identitas.mataPelajaran} pada jenjang SD bersifat konseptual dan prosedural yang sangat aplikatif, dekat dengan fenomena kehidupan sehari-hari anak, serta memerlukan eksplorasi media konkret atau manipulatif.`;
        }
        return prev;
      });
    } else {
      setSelectedTPs([]);
    }
  };

  // Handle clicking an Element Card in Step 3
  const handleSelectElementCard = (elemenName: string) => {
    setManualActiveElemen(elemenName);
    const elLower = (elemenName || '').toLowerCase();
    const tpsInThisElemen = availableTPsForClass.filter((t) => {
      const tEl = (t.elemen || '').toLowerCase();
      return (tEl && elLower && tEl.includes(elLower)) || (elLower && tEl && elLower.includes(tEl));
    });

    if (tpsInThisElemen.length > 0) {
      setSelectedTPs([tpsInThisElemen[0].kodeTP]);
      setTopikMateri(tpsInThisElemen[0].lingkupMateri);
      setKarakteristikMateri((prev) => {
        if (!prev || prev.includes('bersifat konseptual dan prosedural')) {
          return `Materi ${tpsInThisElemen[0].lingkupMateri || identitas.mataPelajaran} pada jenjang SD bersifat konseptual dan prosedural yang sangat aplikatif, dekat dengan fenomena kehidupan sehari-hari anak, serta memerlukan eksplorasi media konkret atau manipulatif.`;
        }
        return prev;
      });
    } else {
      setSelectedTPs([]);
      setTopikMateri(`Pembelajaran Elemen ${elemenName}`);
    }
  };

  // Topik & Alokasi
  const initialTopic = () => {
    if (initialOptions?.topikMateri) return initialOptions.topikMateri;
    const firstMatched = availableTPsForClass.find((t) => selectedTPs.includes(t.kodeTP));
    return firstMatched ? firstMatched.lingkupMateri : identitas.mataPelajaran;
  };

  const [topikMateri, setTopikMateri] = useState(initialTopic);
  const [selectedSemester, setSelectedSemester] = useState<string>(
    initialOptions?.semester || identitas.semester || '1'
  );
  const [alokasiWaktu, setAlokasiWaktu] = useState(
    initialOptions?.alokasiWaktu || '2 x 35 Menit (1 kali pertemuan)'
  );

  // Selected TP objects from available list
  const selectedTPObjects = useMemo(() => {
    return availableTPsForClass.filter((tp) => selectedTPs.includes(tp.kodeTP));
  }, [availableTPsForClass, selectedTPs]);

  // Total JP from selected TPs according to Analisis TP document
  const totalSelectedJP = useMemo(() => {
    const sum = selectedTPObjects.reduce((acc, curr) => acc + (Number(curr.alokasiJP) || 0), 0);
    return sum > 0 ? sum : 2;
  }, [selectedTPObjects]);

  // Batas wajib alokasi SD: minimal 2 JP dan maksimal 3 JP per pertemuan
  const minAllowedPertemuan = useMemo(() => {
    return Math.max(1, Math.ceil(totalSelectedJP / 3));
  }, [totalSelectedJP]);

  const maxAllowedPertemuan = useMemo(() => {
    return Math.max(1, Math.floor(totalSelectedJP / 2));
  }, [totalSelectedJP]);

  // Standar Ideal Pertemuan SD: Math.max(1, Math.floor(totalSelectedJP / 2))
  // Misal: 12 JP -> 6 pertemuan (2-2-2-2-2-2)
  // Misal: 11 JP -> 5 pertemuan (2-2-2-2-3)
  // Misal: 8 JP -> 4 pertemuan (2-2-2-2)
  const idealPertemuanCount = useMemo(() => {
    return maxAllowedPertemuan;
  }, [maxAllowedPertemuan]);

  const formatAlokasiString = useCallback((totalJP: number, count: number) => {
    const list = distributeJPPerMeeting(totalJP, count);
    const allSame = list.every((val) => val === list[0]);
    if (count === 1) {
      return `${totalJP} JP (${totalJP} x 35 Menit)`;
    }
    if (allSame) {
      return `${totalJP} JP (${count} Pertemuan @ ${list[0]} JP x 35 Menit)`;
    }
    return `${totalJP} JP (${count} Pertemuan @ ${list.join('-')} JP x 35 Menit)`;
  }, []);

  // Meeting count state
  const [jumlahPertemuan, setJumlahPertemuan] = useState<number>(() => {
    if (initialOptions?.jumlahPertemuan && initialOptions.jumlahPertemuan > 0) {
      const init = initialOptions.jumlahPertemuan;
      const minC = Math.max(1, Math.ceil(totalSelectedJP / 3));
      const maxC = Math.max(1, Math.floor(totalSelectedJP / 2));
      if (init >= minC && init <= maxC) {
        return init;
      }
    }
    return Math.max(1, Math.floor(totalSelectedJP / 2));
  });

  const [warningDismissed, setWarningDismissed] = useState<boolean>(false);
  const [lastJPSeen, setLastJPSeen] = useState<number>(totalSelectedJP);

  // When selected TP changes and total JP changes, reopen warning if JP > 2
  useEffect(() => {
    if (totalSelectedJP !== lastJPSeen) {
      setLastJPSeen(totalSelectedJP);
      if (totalSelectedJP > 2) {
        setWarningDismissed(false);
      }
      setJumlahPertemuan(idealPertemuanCount);
      setAlokasiWaktu(formatAlokasiString(totalSelectedJP, idealPertemuanCount));
    }
  }, [totalSelectedJP, lastJPSeen, idealPertemuanCount, formatAlokasiString]);

  // Auto-apply ideal meeting distribution
  const handleApplyIdealMeetings = () => {
    setJumlahPertemuan(idealPertemuanCount);
    setAlokasiWaktu(formatAlokasiString(totalSelectedJP, idealPertemuanCount));
    setWarningDismissed(true);
  };

  // Close warning card: as requested, closing the card also triggers auto-configuration
  const handleCloseWarningCard = () => {
    setJumlahPertemuan(idealPertemuanCount);
    setAlokasiWaktu(formatAlokasiString(totalSelectedJP, idealPertemuanCount));
    setWarningDismissed(true);
  };

  // Set specific meeting count manually
  const handleSetCustomPertemuan = (count: number) => {
    const validCount = Math.max(minAllowedPertemuan, Math.min(count, maxAllowedPertemuan));
    setJumlahPertemuan(validCount);
    setAlokasiWaktu(formatAlokasiString(totalSelectedJP, validCount));
  };

  // Model & Pendekatan
  const [modelPembelajaran, setModelPembelajaran] = useState(
    initialOptions?.modelPembelajaran || 'Problem Based Learning (PBL)'
  );
  const [pendekatanPembelajaran, setPendekatanPembelajaran] = useState(
    initialOptions?.pendekatanPembelajaran ||
      'Pembelajaran Mendalam (Deep Learning - Mindful, Meaningful, Joyful)'
  );

  // Metode Pembelajaran (Checkbox + Manual Input)
  const [metodeList, setMetodeList] = useState<string[]>(() => {
    return initialOptions?.metodePembelajaran || [
      'Diskusi Kelompok',
      'Tanya Jawab Interaktif',
      'Eksplorasi Kontekstual',
      'Praktik Langsung / Eksperimen',
    ];
  });
  const [customMetodeInput, setCustomMetodeInput] = useState('');

  // Mitra Pembelajaran: Internal & Eksternal (Full user choice, omission if not selected)
  const [useMitraInternal, setUseMitraInternal] = useState(
    initialOptions?.useMitraInternal ?? true
  );
  const [mitraInternalList, setMitraInternalList] = useState<string[]>(() => {
    return initialOptions?.mitraInternal || [
      'Guru Kelas / Guru Mata Pelajaran',
      'Murid (Tutor Sebaya)',
    ];
  });
  const [customMitraInternal, setCustomMitraInternal] = useState('');

  const [useMitraEksternal, setUseMitraEksternal] = useState(
    initialOptions?.useMitraEksternal ?? true
  );
  const [mitraEksternalList, setMitraEksternalList] = useState<string[]>(() => {
    return initialOptions?.mitraEksternal || [
      'Orang Tua / Wali Murid',
      'Komunitas Lingkungan Sekitar Sekolah',
    ];
  });
  const [customMitraEksternal, setCustomMitraEksternal] = useState('');

  // Pemanfaatan Digital
  const [useDigital, setUseDigital] = useState(true);
  const [platformList, setPlatformList] = useState<string[]>(() => {
    return initialOptions?.pemanfaatanPlatform || [
      'Video Pembelajaran / YouTube',
      'Slide Interaktif / Canva',
    ];
  });
  const [customPlatform, setCustomPlatform] = useState('');

  const [perangkatList, setPerangkatList] = useState<string[]>(() => {
    return initialOptions?.pemanfaatanPerangkat || [
      'Laptop / Komputer',
      'LCD Proyektor',
    ];
  });
  const [customPerangkat, setCustomPerangkat] = useState('');

  const [mediaList, setMediaList] = useState<string[]>(() => {
    return initialOptions?.pemanfaatanMedia || [
      'Video Pembelajaran Kontekstual',
      'Slide Presentasi Bergambar',
    ];
  });
  const [customMedia, setCustomMedia] = useState('');

  // Lingkungan & Budaya
  const [lingkunganFisikList, setLingkunganFisikList] = useState<string[]>(() => {
    return initialOptions?.lingkunganFisik || [
      'Ruang Kelas Fleksibel Berkelompok',
      'Pojok Baca / Perpustakaan',
    ];
  });
  const [lingkunganFisikDeskripsi, setLingkunganFisikDeskripsi] = useState(
    initialOptions?.lingkunganFisikDeskripsi ||
      'Ruang kelas ditata secara dinamis dengan formasi meja melingkar (4-5 murid per kelompok) untuk memfasilitasi interaksi aktif.'
  );

  const [budayaBelajarList, setBudayaBelajarList] = useState<string[]>(() => {
    return initialOptions?.budayaBelajar || [
      'Gotong Royong & Kerja Sama',
      'Saling Menghargai & Inklusif',
      'Rasa Ingin Tahu Tinggi & Berani Bertanya',
      'Refleksi Diri yang Terbiasa',
    ];
  });

  // Karakteristik & Kebutuhan Murid
  const [karakteristikList, setKarakteristikList] = useState<string[]>(() => {
    return initialOptions?.karakteristikMurid || [
      'Rasa ingin tahu tinggi',
      'Suka belajar konkret & manipulatif',
      'Senang belajar secara berkelompok',
    ];
  });
  const [karakteristikCustom, setKarakteristikCustom] = useState(
    initialOptions?.karakteristikMuridCustom ||
      'Siswa antusias terhadap tantangan visual, demonstrasi langsung, dan permainan edukatif.'
  );
  const [kebutuhanMurid, setKebutuhanMurid] = useState(
    initialOptions?.kebutuhanMurid ||
      'Memerlukan media ajar konkret/manipulatif, bimbingan berjenjang (scaffolding), serta kolaborasi aktif dalam memecahkan masalah kontekstual.'
  );

  // Karakteristik Materi (Pilihan preset atau input manual bebas)
  const MATERI_PRESETS = [
    'Konseptual & Prosedural Aplikatif',
    'Kontekstual dengan Masalah Nyata Sehari-hari',
    'Abstrak ke Konkret (Membutuhkan Benda Manipulatif)',
    'Investigasi & Pemecahan Masalah (Problem Solving)',
    'Eksplorasi Lingkungan & Pengamatan Langsung',
    'Keterampilan Proses & Kolaborasi Praktis',
  ];

  const [karakteristikMateri, setKarakteristikMateri] = useState<string>(() => {
    if (initialOptions?.karakteristikMateri) return initialOptions.karakteristikMateri;
    return `Materi ${topikMateri || identitas.mataPelajaran} pada jenjang SD bersifat konseptual dan prosedural yang sangat aplikatif, dekat dengan fenomena kehidupan sehari-hari anak, serta memerlukan eksplorasi media konkret atau manipulatif.`;
  });

  // Dimensi Profil Lulusan
  const [dplList, setDplList] = useState<string[]>(() => {
    if (initialOptions?.dimensiProfilLulusan && initialOptions.dimensiProfilLulusan.length > 0) {
      return initialOptions.dimensiProfilLulusan;
    }
    const firstTP = tpList.find((t) => selectedTPs.includes(t.kodeTP));
    if (firstTP && Array.isArray(firstTP.dimensiP3) && firstTP.dimensiP3.length >= 3) {
      return firstTP.dimensiP3;
    }
    return ['Penalaran Kritis', 'Kemandirian', 'Kolaborasi'];
  });

  // Active subtab inside modal for clean navigation
  const [modalTab, setModalTab] = useState<'tp' | 'metode' | 'mitra' | 'digital' | 'lingkungan'>('tp');

  // Step Completion Validation States
  const isStep1Complete = selectedTPs.length > 0;
  const isStep2Complete = metodeList.length > 0;
  const isStep3Complete = true; // Mitra internal/eksternal adalah opsional per standar
  const isStep4Complete = true; // Digital adalah opsional sesuai ketersediaan sarana
  const isStep5Complete =
    (lingkunganFisikList.length > 0 || lingkunganFisikDeskripsi.trim().length > 0) &&
    budayaBelajarList.length > 0 &&
    dplList.length > 0;

  const isAllComplete = isStep1Complete && isStep2Complete && isStep5Complete;

  const goToNextStep = () => {
    if (modalTab === 'tp') {
      if (selectedTPs.length === 0) {
        alert('Pilih minimal satu Tujuan Pembelajaran (TP) pada Langkah 1 sebelum melanjutkan.');
        return;
      }
      setModalTab('metode');
    } else if (modalTab === 'metode') {
      if (metodeList.length === 0) {
        alert('Pilih minimal satu Metode Pembelajaran pada Langkah 2 sebelum melanjutkan.');
        return;
      }
      setModalTab('mitra');
    } else if (modalTab === 'mitra') {
      setModalTab('digital');
    } else if (modalTab === 'digital') {
      setModalTab('lingkungan');
    }
  };

  const goToPrevStep = () => {
    if (modalTab === 'metode') setModalTab('tp');
    else if (modalTab === 'mitra') setModalTab('metode');
    else if (modalTab === 'digital') setModalTab('mitra');
    else if (modalTab === 'lingkungan') setModalTab('digital');
  };

  // Helpers to toggle arrays
  const toggleItem = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const addCustomItem = (
    list: string[],
    setList: (val: string[]) => void,
    item: string,
    clearInput: () => void
  ) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    if (!list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
    clearInput();
  };

  const removeItem = (list: string[], setList: (val: string[]) => void, item: string) => {
    setList(list.filter((i) => i !== item));
  };

  // State & helper untuk mengedit item yang sudah dipilih (Platform, Perangkat, Media, dll.)
  const [editingDigitalItem, setEditingDigitalItem] = useState<{
    category: 'platform' | 'perangkat' | 'media';
    index: number;
    value: string;
  } | null>(null);

  const handleSaveEditedDigitalItem = (
    list: string[],
    setList: (val: string[]) => void
  ) => {
    if (!editingDigitalItem) return;
    const trimmed = editingDigitalItem.value.trim();
    if (!trimmed) {
      setEditingDigitalItem(null);
      return;
    }
    const updated = [...list];
    if (editingDigitalItem.index >= 0 && editingDigitalItem.index < updated.length) {
      updated[editingDigitalItem.index] = trimmed;
      setList(Array.from(new Set(updated)));
    }
    setEditingDigitalItem(null);
  };

  const handleSelectTPToggle = (tp: TPItem) => {
    const kode = tp.kodeTP;
    const tpElemen = (tp.elemen || '').trim();

    if (selectedTPs.includes(kode)) {
      if (selectedTPs.length === 1) {
        alert('Minimal harus memilih 1 Tujuan Pembelajaran (TP) untuk modul ajar pertemuan ini.');
        return;
      }
      setSelectedTPs(selectedTPs.filter((k) => k !== kode));
    } else {
      // Check if tp is from the same element
      if (activeElemen && tpElemen === activeElemen) {
        // Can add multiple TPs if from the SAME element
        setSelectedTPs([...selectedTPs, kode]);
      } else {
        // Different element: per standard 1 meeting focuses on 1 element
        // Switch to this new element with this TP selected
        setSelectedTPs([kode]);
        setTopikMateri(tp.lingkupMateri);
        setKarakteristikMateri((prev) => {
          if (!prev || prev.includes('bersifat konseptual dan prosedural')) {
            return `Materi ${tp.lingkupMateri || identitas.mataPelajaran} pada jenjang SD bersifat konseptual dan prosedural yang sangat aplikatif, dekat dengan fenomena kehidupan sehari-hari anak, serta memerlukan eksplorasi media konkret atau manipulatif.`;
          }
          return prev;
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Pastikan user telah menyelesaikan tahapan hingga Langkah 5 (Lingkungan Belajar)
    if (modalTab !== 'lingkungan') {
      goToNextStep();
      return;
    }

    if (selectedTPs.length === 0) {
      alert('Pilih minimal satu Tujuan Pembelajaran (TP) pada Langkah 1.');
      setModalTab('tp');
      return;
    }

    if (metodeList.length === 0) {
      alert('Pilih minimal satu Metode Pembelajaran pada Langkah 2.');
      setModalTab('metode');
      return;
    }

    if (dplList.length === 0) {
      alert('Pilih minimal satu Dimensi Profil Lulusan pada Langkah 5.');
      return;
    }

    if (lingkunganFisikList.length === 0 && !lingkunganFisikDeskripsi.trim()) {
      alert('Pilih minimal satu Lingkungan Fisik atau isi deskripsi penataan ruang pada Langkah 5 (Lingkungan Belajar).');
      return;
    }

    if (budayaBelajarList.length === 0) {
      alert('Pilih minimal satu Budaya Belajar pada Langkah 5 (Lingkungan Belajar).');
      return;
    }

    if (onUpdateIdentitas) {
      onUpdateIdentitas({
        ...identitas,
        namaSatuanPendidikan: schoolName.trim() || identitas.namaSatuanPendidikan,
        namaGuru: guruName.trim() || identitas.namaGuru,
        nipGuru: nipGuru.trim(),
        peranGuru: peranGuru,
        namaKepalaSekolah: kepalaSekolah.trim() || identitas.namaKepalaSekolah,
        nipKepalaSekolah: nipKepalaSekolah.trim(),
        kelas: selectedKelas,
        semester: selectedSemester as any,
      });
    }

    const finalOptions: RPMConfigOptions = {
      selectedKelas,
      semester: selectedSemester,
      selectedTPCodes: selectedTPs,
      elemen: activeElemen,
      capaianPembelajaran: activeElementCPText,
      capaianPembelajaranPerElemen: cpResolution.perElemenList.length > 0
        ? cpResolution.perElemenList
        : [{ elemen: activeElemen, capaianPembelajaran: activeElementCPText }],
      topikMateri: topikMateri.trim() || identitas.mataPelajaran,
      alokasiWaktu: (() => {
        const raw = alokasiWaktu.trim();
        if (!raw || raw === '2 x 35 Menit (1 kali pertemuan)' || !raw.includes(`${totalSelectedJP} JP`)) {
          return formatAlokasiString(totalSelectedJP, jumlahPertemuan);
        }
        return raw;
      })(),
      jumlahPertemuan: Math.max(minAllowedPertemuan, Math.min(jumlahPertemuan, maxAllowedPertemuan)),
      totalJP: totalSelectedJP,
      modelPembelajaran,
      pendekatanPembelajaran,
      metodePembelajaran: metodeList,
      useMitraInternal,
      mitraInternal: useMitraInternal ? mitraInternalList : [],
      useMitraEksternal,
      mitraEksternal: useMitraEksternal ? mitraEksternalList : [],
      pemanfaatanPlatform: useDigital ? platformList : [],
      pemanfaatanPerangkat: useDigital ? perangkatList : [],
      pemanfaatanMedia: useDigital ? mediaList : [],
      lingkunganFisik: lingkunganFisikList,
      lingkunganFisikDeskripsi: lingkunganFisikDeskripsi.trim(),
      budayaBelajar: budayaBelajarList,
      karakteristikMateri: karakteristikMateri.trim(),
      karakteristikMurid: karakteristikList,
      karakteristikMuridCustom: karakteristikCustom.trim(),
      kebutuhanMurid: kebutuhanMurid.trim(),
      dimensiProfilLulusan: dplList,
    };

    onConfirm(finalOptions);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div 
        className="bg-white rounded-2xl border-2 border-slate-300 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-[#0B1528] text-white p-4 sm:p-5 flex items-start justify-between border-b-2 border-amber-400/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  Tahap 5 • Konfigurasi RPM
                </span>
                <span className="text-xs text-slate-300 font-semibold">
                  {identitas.mataPelajaran} ({identitas.fase} - Kelas {selectedKelas})
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Konfigurasi Rencana Pembelajaran Mendalam (RPM)
              </h2>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Tentukan pilihan kelas, metode, mitra pembelajaran, pemanfaatan digital, dan komponen sebelum modul disusun.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Subtabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-3 sm:px-4 py-2 flex items-center gap-1.5 overflow-x-auto text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setModalTab('tp')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              modalTab === 'tp'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-700 hover:bg-slate-200 font-semibold'
            }`}
          >
            <span>🎯</span>
            <span>1. Kelas &amp; TP</span>
            {isStep1Complete ? (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">✓</span>
            ) : (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] flex items-center justify-center font-bold">!</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setModalTab('metode')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              modalTab === 'metode'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-700 hover:bg-slate-200 font-semibold'
            }`}
          >
            <span>💡</span>
            <span>2. Metode</span>
            {isStep2Complete ? (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">✓</span>
            ) : (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] flex items-center justify-center font-bold">!</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setModalTab('mitra')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              modalTab === 'mitra'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-700 hover:bg-slate-200 font-semibold'
            }`}
          >
            <span>🤝</span>
            <span>3. Mitra</span>
            <span className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 text-[10px] flex items-center justify-center font-bold">
              {useMitraInternal || useMitraEksternal ? '✓' : '•'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('digital')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              modalTab === 'digital'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-700 hover:bg-slate-200 font-semibold'
            }`}
          >
            <span>💻</span>
            <span>4. Digital</span>
            <span className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 text-[10px] flex items-center justify-center font-bold">
              {useDigital ? '✓' : '•'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('lingkungan')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              modalTab === 'lingkungan'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : isStep5Complete
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold'
                : 'text-slate-700 hover:bg-slate-200 font-semibold'
            }`}
          >
            <span>🏫</span>
            <span>5. Lingkungan Belajar (Wajib)</span>
            {isStep5Complete ? (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">✓</span>
            ) : (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] flex items-center justify-center font-bold">!</span>
            )}
          </button>
        </div>

        {/* Step Progress & Sequence Guide Bar */}
        <div className="bg-slate-50 px-3 sm:px-4 py-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black shrink-0">
              {modalTab === 'tp' ? '1' : modalTab === 'metode' ? '2' : modalTab === 'mitra' ? '3' : modalTab === 'digital' ? '4' : '5'}
            </span>
            <span className="font-bold text-slate-800">
              {modalTab === 'tp' && 'Langkah 1 dari 5: Pemilihan Kelas, Semester & Tujuan Pembelajaran'}
              {modalTab === 'metode' && 'Langkah 2 dari 5: Praktik Pedagogis & Pilihan Metode'}
              {modalTab === 'mitra' && 'Langkah 3 dari 5: Penentuan Kemitraan Pembelajaran (Internal & Eksternal)'}
              {modalTab === 'digital' && 'Langkah 4 dari 5: Pemanfaatan Platform, Perangkat & Media Digital'}
              {modalTab === 'lingkungan' && 'Langkah 5 dari 5 (Final): Lingkungan Belajar, Budaya Belajar & Profil Lulusan'}
            </span>
          </div>

          <div>
            {modalTab !== 'lingkungan' ? (
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/90 border border-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Tombol Buat Dokumen muncul di Langkah 5 setelah Lingkungan Belajar terisi</span>
              </span>
            ) : (
              <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shadow-2xs ${
                isStep5Complete
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                  : 'bg-amber-100 text-amber-950 border-amber-300'
              }`}>
                {isStep5Complete ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Langkah 5 Lengkap! Menu Buat Dokumen Telah Terbuka</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Pilih minimal 1 Lingkungan Fisik &amp; 1 Budaya Belajar</span>
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Modal Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs text-slate-800">
          {/* TAB 1: IDENTITAS, KELAS, ELEMEN & TP */}
          {modalTab === 'tp' && (
            <div className="space-y-4 animate-fade-in">
              {/* Quick Subject & Navigation Bar */}
              <div className="bg-gradient-to-r from-[#0B1528] via-[#122244] to-[#0B1528] border-2 border-amber-400/60 rounded-xl p-3 sm:p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 shadow-md shrink-0 flex items-center justify-center text-xl font-bold border border-amber-300">
                    {getSubjectEmoticon(identitas.mataPelajaran)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                        Modul Ajar Kurikulum Merdeka
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        <span>Dokumen Kurikulum Aktif</span>
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2 mt-0.5">
                      <span>{identitas.mataPelajaran}</span>
                      <span className="text-amber-300 font-bold text-xs bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                        {identitas.fase}
                      </span>
                    </h3>
                  </div>
                </div>

                {(onOpenSubjectPicker || onGoToCPInput) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenSubjectPicker) {
                        onOpenSubjectPicker();
                      } else if (onGoToCPInput) {
                        onGoToCPInput();
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/30 hover:from-amber-500/30 hover:to-amber-600/40 text-amber-300 text-xs font-extrabold border-2 border-amber-500/50 hover:border-amber-400 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-sm"
                    title="Ganti Mata Pelajaran tanpa kehilangan dokumen yang telah dibuat"
                  >
                    <span>🔁 Ganti Mata Pelajaran</span>
                  </button>
                )}
              </div>

              {/* LANGKAH 1: LENGKAPI IDENTITAS MODUL AJAR */}
              <div className="bg-white border-2 border-slate-300 rounded-xl shadow-xs overflow-hidden">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                      1
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                        <School className="w-3.5 h-3.5 text-blue-600" />
                        <span>Langkah 1: Lengkapi Identitas Modul Ajar</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Identitas satuan pendidikan dan guru penyusun yang tertera pada dokumen Modul Ajar.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsIdentityExpanded(!isIdentityExpanded)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isIdentityExpanded ? 'Sembunyikan Form' : 'Edit Identitas Lengkap'}</span>
                    {isIdentityExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Identity Summary Bar when collapsed */}
                {!isIdentityExpanded ? (
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] bg-slate-50/50">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-bold">Sekolah:</span>
                      <span className="truncate font-semibold text-slate-900">{schoolName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-bold">Guru:</span>
                      <span className="truncate font-semibold text-slate-900">{guruName} ({peranGuru})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-bold">Kepala Sekolah:</span>
                      <span className="truncate font-semibold text-slate-900">{kepalaSekolah}</span>
                    </div>
                  </div>
                ) : (
                  /* Expanded Identity Form */
                  <div className="p-4 space-y-3 bg-white">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Nama Satuan Pendidikan:
                        </label>
                        <input
                          type="text"
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                          placeholder="SD Negeri Fatubai"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Peran Guru Mata Pelajaran:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPeranGuru('Guru Kelas')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                              peranGuru === 'Guru Kelas'
                                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            Guru Kelas
                          </button>
                          <button
                            type="button"
                            onClick={() => setPeranGuru('Guru Mata Pelajaran')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                              peranGuru === 'Guru Mata Pelajaran'
                                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            Guru Mata Pelajaran
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Nama Guru Penyusun:
                        </label>
                        <input
                          type="text"
                          value={guruName}
                          onChange={(e) => setGuruName(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                          placeholder="Roni Hariyanto Bhidju, S. Pd"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          NIP Guru Penyusun (Opsional):
                        </label>
                        <input
                          type="text"
                          value={nipGuru}
                          onChange={(e) => setNipGuru(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                          placeholder="NIP Guru / -"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Nama Kepala Satuan Pendidikan:
                        </label>
                        <input
                          type="text"
                          value={kepalaSekolah}
                          onChange={(e) => setKepalaSekolah(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                          placeholder="Darius Kusi, S.Pd."
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          NIP Kepala Sekolah:
                        </label>
                        <input
                          type="text"
                          value={nipKepalaSekolah}
                          onChange={(e) => setNipKepalaSekolah(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                          placeholder="196709192008011008"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* LANGKAH 2: TENTUKAN KELAS & SEMESTER */}
              <div className="bg-slate-50 border-2 border-blue-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                      2
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-blue-700" />
                        <span>Langkah 2: Tentukan Kelas &amp; Semester Pertemuan Modul</span>
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Pilih kelas sasaran ({identitas.fase}) dan semester untuk pertemuan pembelajaran ini.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-300">
                    Kelas {selectedKelas} • Semester {selectedSemester === '1' ? '1 (Ganjil)' : '2 (Genap)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {possibleClasses.map((cls) => {
                    const isSelected = selectedKelas === cls;
                    const count = filterTPListByClass(tpList, cls, identitas.fase).length;
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => handleSelectKelasChange(cls)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer border-2 ${
                          isSelected
                            ? 'bg-gradient-to-br from-blue-700 to-blue-900 text-white border-blue-950 shadow-md ring-2 ring-blue-400/50'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                        }`}
                      >
                        <span className="text-sm font-black">Kelas {cls}</span>
                        <span className={`text-[10px] mt-1 px-2 py-0.5 rounded-full font-bold ${isSelected ? 'bg-blue-950 text-amber-300' : 'bg-slate-100 text-slate-600'}`}>
                          {count} TP di ATP
                        </span>
                      </button>
                    );
                  })}

                  {[
                    { val: '1', label: 'Semester 1 (Ganjil)' },
                    { val: '2', label: 'Semester 2 (Genap)' },
                  ].map((sem) => {
                    const isSelected = selectedSemester === sem.val;
                    return (
                      <button
                        key={sem.val}
                        type="button"
                        onClick={() => setSelectedSemester(sem.val)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer border-2 ${
                          isSelected
                            ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 border-amber-700 shadow-md ring-2 ring-amber-300'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                        }`}
                      >
                        <span className="text-xs font-black">{sem.label}</span>
                        <span className={`text-[10px] mt-1 font-medium ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                          T.A. 2025/2026
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LANGKAH 3: PILIH ELEMEN LENGKAP BSKAP 046/2025 */}
              <div className="bg-white border-2 border-slate-300 rounded-xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                      3
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Langkah 3: Pilih Elemen Pembelajaran Secara Lengkap</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Seluruh elemen resmi {identitas.mataPelajaran} ({identitas.fase}) disajikan lengkap. Klik salah satu elemen untuk fokus pertemuan ini:
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                    {allSubjectElements.length} Elemen Resmi BSKAP
                  </span>
                </div>

                {/* Elements Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {allSubjectElements.map((elItem, idx) => {
                    const elName = (elItem.elemen || '').toLowerCase().trim();
                    const actName = (activeElemen || '').toLowerCase().trim();
                    const isSelected = actName === elName;
                    const tpsInThisElemen = availableTPsForClass.filter((t) => {
                      const tEl = (t.elemen || '').toLowerCase().trim();
                      return (tEl && elName && tEl.includes(elName)) || (elName && tEl && elName.includes(tEl));
                    });

                    return (
                      <button
                        key={elItem.elemen || idx}
                        type="button"
                        onClick={() => handleSelectElementCard(elItem.elemen)}
                        className={`text-left p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-600 shadow-sm ring-2 ring-blue-400/40'
                            : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                              Elemen {idx + 1}
                            </span>
                            {isSelected ? (
                              <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9.5px] font-black flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" /> Fokus Modul
                              </span>
                            ) : (
                              <span className="text-[9.5px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {tpsInThisElemen.length} TP
                              </span>
                            )}
                          </div>
                          <h5 className={`text-xs font-black line-clamp-1 ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                            {elItem.elemen}
                          </h5>
                          {elItem.deskripsi && (
                            <p className="text-[10.5px] text-slate-500 line-clamp-2 leading-relaxed">
                              {elItem.deskripsi}
                            </p>
                          )}
                        </div>

                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className={isSelected ? 'text-blue-700 font-bold' : 'text-slate-500 font-medium'}>
                            {tpsInThisElemen.length > 0 ? `${tpsInThisElemen.length} TP di Kelas ${selectedKelas}` : `Dialokasikan di fase ini`}
                          </span>
                          <span className={`font-bold ${isSelected ? 'text-blue-700' : 'text-slate-400'}`}>
                            {isSelected ? 'Aktif' : 'Pilih'} &rarr;
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LANGKAH 4: RUNTUTAN TERPADU DOKUMEN MODUL */}
              <div className="bg-white border-2 border-blue-300 rounded-xl overflow-hidden shadow-sm space-y-0">
                {/* Header Banner: Mata Pelajaran & Elemen Terpadu */}
                <div className="p-3.5 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">
                      Runtutan Modul Ajar Terpadu
                    </div>
                    <div className="text-sm font-black flex items-center gap-2 flex-wrap">
                      <span>{identitas.mataPelajaran}</span>
                      <span className="text-amber-300">&bull;</span>
                      <span className="text-amber-300">Elemen: {activeElemen}</span>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded bg-blue-950/80 border border-blue-400/40 text-[11px] font-bold text-blue-100">
                    SD &bull; {identitas.fase} &bull; Kelas {selectedKelas} &bull; Semester {selectedSemester === '1' ? '1 (Ganjil)' : '2 (Genap)'}
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-4 space-y-4">
                  {/* Capaian Pembelajaran Elemen */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Capaian Pembelajaran (CP) Elemen {activeElemen}:</span>
                      </label>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">
                        BSKAP No. 046 Tahun 2025
                      </span>
                    </div>
                    <p className="text-slate-800 leading-relaxed text-justify text-[11.5px] bg-white p-3 rounded-lg border border-slate-200">
                      {activeElementCPText}
                    </p>
                  </div>

                  {/* Tujuan Pembelajaran (TP) yang Telah Disusun di ATP Berdasarkan Elemen Ini */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Tujuan Pembelajaran (TP) yang Telah Disusun di ATP Berdasarkan Elemen Ini (Kelas {selectedKelas}):</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-bold">
                        Pilih minimal 1 TP untuk modul ajar pertemuan ini
                      </span>
                    </div>

                    {/* Filtered TPs list for active element in selected class */}
                    {(() => {
                      const act = (activeElemen || '').toLowerCase();
                      const tpsInThisElemen = availableTPsForClass.filter((t) => {
                        const tEl = (t.elemen || '').toLowerCase();
                        return (tEl && act && tEl.includes(act)) || (act && tEl && act.includes(tEl));
                      });

                      if (tpsInThisElemen.length === 0) {
                        return (
                          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                            <div className="font-bold flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>Belum ada TP khusus untuk Elemen {activeElemen} pada Kelas {selectedKelas} di alur ATP Anda.</span>
                            </div>
                            <p className="text-[11px] text-amber-800">
                              Elemen ini terdaftar resmi pada {identitas.fase}, namun belum teralokasi ke Kelas {selectedKelas} atau materi dialokasikan ke kelas lain pada fase ini. Anda dapat memilih elemen lain di atas atau tetap menyusun topik modul ajar secara manual di bawah.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs divide-y divide-slate-200 max-h-64 overflow-y-auto">
                          {tpsInThisElemen.map((tp) => {
                            const isChecked = selectedTPs.includes(tp.kodeTP);
                            return (
                              <label
                                key={tp.id}
                                className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                                  isChecked ? 'bg-blue-50/80 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleSelectTPToggle(tp)}
                                  className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                                />
                                <div className="flex-1 space-y-0.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-black text-[10px] border border-blue-200">
                                      TP {tp.kodeTP}
                                    </span>
                                    <span className="font-bold text-slate-900">{tp.lingkupMateri}</span>
                                    <span className="text-[10px] text-slate-500 font-medium">({tp.alokasiJP} JP)</span>
                                    {isChecked && (
                                      <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9.5px] font-bold">
                                        Terpilih
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-700 text-[11px] leading-relaxed">{tp.rumusanTP}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* SMART JP WARNING CARD & MULTI-MEETING SYSTEM */}
                  {totalSelectedJP > 2 && !warningDismissed && (
                    <div 
                      id="card-warning-jp"
                      className="p-4 bg-gradient-to-r from-amber-50 via-orange-50/60 to-amber-50 border-2 border-amber-400 rounded-xl shadow-xs space-y-3 relative transition-all animate-fadeIn"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-lg bg-amber-500 text-white shadow-2xs shrink-0 mt-0.5">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                                Peringatan Alokasi Beban Belajar ({totalSelectedJP} JP)
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px] border border-amber-300">
                                Berdasarkan Dokumen Analisis TP
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-900/90 font-medium mt-0.5 leading-relaxed">
                              Tujuan Pembelajaran yang Anda pilih memiliki alokasi beban belajar sebesar <strong>{totalSelectedJP} JP</strong>. Jangan sampai materi berbeban <strong>{totalSelectedJP} JP</strong> hanya dirancang untuk <strong>1 kali pertemuan (durasi 2 JP)</strong>, karena capaian kompetensi tidak akan tuntas dan berpotensi membebani murid!
                            </p>
                          </div>
                        </div>

                        {/* Tombol Close Kartu Warning (Sesuai instruksi: kartu warning bisa diklose sehingga sistem otomatis merancang idealnya berapa pertemuan) */}
                        <button
                          type="button"
                          onClick={handleCloseWarningCard}
                          title="Tutup kartu peringatan ini dan biarkan sistem otomatis merancang alokasi pertemuan ideal"
                          className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-amber-800 hover:text-amber-950 border border-amber-300 shadow-2xs transition-all cursor-pointer shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Rekomendasi Cerdas Distribusi Pertemuan */}
                      <div className="p-3 bg-white/90 rounded-lg border border-amber-300/80 text-xs space-y-1.5 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-amber-950 font-bold">
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Rekomendasi Cerdas Distribusi Pembelajaran Mendalam (Aturan Baku 2 - 3 JP):</span>
                        </div>
                        <p className="text-slate-700 text-[11px] leading-relaxed">
                          Sesuai Permendikdasmen No. 13 Tahun 2025, setiap kali pertemuan jenjang SD terdiri dari <strong>minimal 2 JP dan maksimal 3 JP</strong>. Berdasarkan beban <strong>{totalSelectedJP} JP</strong>, alokasi dirancang ideal menjadi <strong>{idealPertemuanCount} Kali Pertemuan</strong> ({formatAlokasiString(totalSelectedJP, idealPertemuanCount)}) agar proses pembelajaran berjenjang tuntas dari pemahaman konsep hingga unjuk karya mandiri.
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleApplyIdealMeetings}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-xs hover:shadow-sm transition-all cursor-pointer border border-amber-700"
                          >
                            <Sparkles className="w-4 h-4 text-amber-200" />
                            <span>⚡ Terapkan Otomatis: Rancang Menjadi {idealPertemuanCount} Pertemuan ({totalSelectedJP} JP)</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleCloseWarningCard}
                            className="px-3 py-2 rounded-lg bg-white hover:bg-amber-100/60 text-amber-900 font-bold text-xs border border-amber-300 transition-all cursor-pointer"
                          >
                            Tutup & Gunakan Rekomendasi
                          </button>
                        </div>
                        <span className="text-[10px] text-amber-800/80 font-semibold italic">
                          *Menutup kartu ini otomatis menerapkan alokasi ideal
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Notifikasi Status Terdistribusi jika Warning Sudah Ditutup */}
                  {totalSelectedJP > 2 && warningDismissed && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-950 shadow-2xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold">
                          Rangkaian Modul Terkonfigurasi:
                        </span>
                        <span className="font-semibold text-emerald-900">
                          {totalSelectedJP} JP dirangkai menjadi <strong>{jumlahPertemuan} Pertemuan</strong> ({alokasiWaktu})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWarningDismissed(false)}
                        className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer shrink-0"
                      >
                        Buka Kartu Peringatan / Atur Ulang
                      </button>
                    </div>
                  )}

                  {/* Topik & Alokasi Waktu Form */}
                  <div className="grid sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Topik / Materi Pembelajaran Pertemuan Ini (Bisa Diedit Manual):
                      </label>
                      <input
                        type="text"
                        value={topikMateri}
                        onChange={(e) => setTopikMateri(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 text-xs shadow-2xs"
                        placeholder="Contoh: Operasi Penjumlahan Bilangan Cacah"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Alokasi Waktu & Distribusi Pertemuan:
                        </label>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500">Jumlah Pertemuan:</span>
                          <div className="inline-flex items-center rounded-md border border-slate-300 bg-white shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleSetCustomPertemuan(jumlahPertemuan - 1)}
                              disabled={jumlahPertemuan <= minAllowedPertemuan}
                              className="px-2 py-0.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                              title={`Kurangi pertemuan (minimal 2 JP per pertemuan, batas min: ${minAllowedPertemuan} pertemuan)`}
                            >
                              -
                            </button>
                            <span className="px-2 py-0.5 text-xs font-extrabold text-blue-900 bg-blue-50/50">
                              {jumlahPertemuan}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSetCustomPertemuan(jumlahPertemuan + 1)}
                              disabled={jumlahPertemuan >= maxAllowedPertemuan}
                              className="px-2 py-0.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                              title={`Tambah pertemuan (maksimal 3 JP per pertemuan, batas maks: ${maxAllowedPertemuan} pertemuan)`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={alokasiWaktu}
                        onChange={(e) => setAlokasiWaktu(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 text-xs shadow-2xs"
                        placeholder="2 x 35 Menit (1 kali pertemuan)"
                        required
                      />

                      {/* Presets & Distribusi JP */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-bold">Pilihan Cerdas (Aturan 2 - 3 JP):</span>
                        {/* Preset Ideal berdasarkan JP TP */}
                        {totalSelectedJP > 2 && (
                          <button
                            type="button"
                            onClick={handleApplyIdealMeetings}
                            className="text-[10px] px-2.5 py-1 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-400 cursor-pointer font-extrabold flex items-center gap-1 shadow-2xs"
                          >
                            <Sparkles className="w-3 h-3 text-amber-700" />
                            <span>Ideal: {idealPertemuanCount} Pertemuan ({formatAlokasiString(totalSelectedJP, idealPertemuanCount).replace(/^[^(]+\(([^)]+)\)$/, '$1')})</span>
                          </button>
                        )}
                        {/* Preset 2 JP per pertemuan jika berbeda dari ideal dan dalam rentang izin */}
                        {totalSelectedJP >= 4 && totalSelectedJP % 2 === 0 && (totalSelectedJP / 2) !== idealPertemuanCount && (totalSelectedJP / 2) >= minAllowedPertemuan && (totalSelectedJP / 2) <= maxAllowedPertemuan && (
                          <button
                            type="button"
                            onClick={() => handleSetCustomPertemuan(totalSelectedJP / 2)}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer font-medium"
                          >
                            {totalSelectedJP / 2} Pertemuan (@ 2 JP)
                          </button>
                        )}
                        {/* Preset 3 JP per pertemuan jika berbeda dari ideal dan dalam rentang izin */}
                        {totalSelectedJP >= 6 && totalSelectedJP % 3 === 0 && (totalSelectedJP / 3) !== idealPertemuanCount && (totalSelectedJP / 3) >= minAllowedPertemuan && (totalSelectedJP / 3) <= maxAllowedPertemuan && (
                          <button
                            type="button"
                            onClick={() => handleSetCustomPertemuan(totalSelectedJP / 3)}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer font-medium"
                          >
                            {totalSelectedJP / 3} Pertemuan (@ 3 JP)
                          </button>
                        )}
                      </div>

                      {/* Rangkaian Timeline Pertemuan */}
                      {jumlahPertemuan > 1 && (
                        <div className="pt-2">
                          <div className="p-2 bg-blue-50/60 rounded-lg border border-blue-200 text-[11px] space-y-1">
                            <span className="font-bold text-blue-950 block">
                              Rangkaian Modul ({jumlahPertemuan} Pertemuan Terhubung):
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {(() => {
                                const currentJPList = distributeJPPerMeeting(totalSelectedJP, jumlahPertemuan);
                                return Array.from({ length: jumlahPertemuan }).map((_, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-blue-900 font-bold border border-blue-300 text-[10px] shadow-2xs"
                                  >
                                    <span>Pertemuan {idx + 1}</span>
                                    <span className="text-blue-700 font-bold">
                                      ({currentJPList[idx] || 2} JP)
                                    </span>
                                    {idx < jumlahPertemuan - 1 && <span className="text-blue-500 ml-1">→</span>}
                                  </span>
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Karakteristik Materi - User Bisa Memilih Preset atau Input Manual */}
              <div className="bg-white border-2 border-amber-300/80 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Karakteristik Materi (Pilih Preset atau Ketik Manual Bebas):</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                    Bisa Dipilih / Diinput Manual
                  </span>
                </div>
                
                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {MATERI_PRESETS.map((preset) => {
                    const isActive = karakteristikMateri.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          if (isActive) {
                            const updated = karakteristikMateri
                              .replace(preset, '')
                              .replace(/;\s*;/g, ';')
                              .replace(/^;\s*/, '')
                              .replace(/;\s*$/, '')
                              .replace(/\.\s*\./g, '.')
                              .trim();
                            setKarakteristikMateri(updated);
                          } else {
                            if (!karakteristikMateri.trim()) {
                              setKarakteristikMateri(preset);
                            } else {
                              const base = karakteristikMateri.trim().replace(/[\.;\s]+$/, '');
                              setKarakteristikMateri(`${base}; ${preset}`);
                            }
                          }
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs'
                            : 'bg-amber-50/80 hover:bg-amber-100 text-amber-950 border-amber-300'
                        }`}
                      >
                        {isActive ? '✓ ' : '+ '}{preset}
                      </button>
                    );
                  })}
                </div>

                {/* Manual Textarea */}
                <div>
                  <textarea
                    rows={3}
                    value={karakteristikMateri}
                    onChange={(e) => setKarakteristikMateri(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white leading-relaxed font-medium shadow-inner"
                    placeholder="Tuliskan atau sesuaikan karakteristik materi pembelajaran secara manual..."
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    * Karakteristik materi akan dicantumkan secara resmi pada Bagian B.2 Dokumen Modul Ajar / RPP.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRAKTIK PEDAGOGIS & METODE */}
          {modalTab === 'metode' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-1">
                <h4 className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                  <Compass className="w-4 h-4 text-amber-600" />
                  <span>Praktik Pedagogis &amp; Pilihan Metode Pembelajaran</span>
                </h4>
                <p className="text-[11px] text-amber-900">
                  User berhak memilih metode dari daftar yang disajikan ATAU mengetik manual metode yang dikehendaki.
                </p>
              </div>

              {/* Model & Pendekatan */}
              <div className="grid sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Model Pembelajaran:
                  </label>
                  <select
                    value={modelPembelajaran}
                    onChange={(e) => setModelPembelajaran(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 text-xs cursor-pointer shadow-2xs"
                  >
                    <option value="Problem Based Learning (PBL)">Problem Based Learning (PBL)</option>
                    <option value="Project Based Learning (PjBL)">Project Based Learning (PjBL)</option>
                    <option value="Inkuiri Terbimbing (Guided Inquiry)">Inkuiri Terbimbing (Guided Inquiry)</option>
                    <option value="Discovery Learning">Discovery Learning</option>
                    <option value="Bermain Peran & Simulasi (Role Play)">Bermain Peran &amp; Simulasi (Role Play)</option>
                    <option value="Diferensiasi Konten & Proses">Diferensiasi Konten &amp; Proses</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Pendekatan Pembelajaran:
                  </label>
                  <input
                    type="text"
                    value={pendekatanPembelajaran}
                    onChange={(e) => setPendekatanPembelajaran(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 text-xs shadow-2xs"
                  />
                </div>
              </div>

              {/* Metode Pembelajaran: Checklist & Custom Input */}
              <div className="space-y-2 pt-2">
                <label className="block text-[11px] font-bold text-slate-800">
                  Pilih Metode Pembelajaran (Centang dari Pilihan yang Disajikan):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_METODE.map((m) => {
                    const isSelected = metodeList.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleItem(metodeList, setMetodeList, m)}
                        className={`px-2.5 py-2 rounded-lg border text-left flex items-center justify-between text-[11px] font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{m}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>

                {/* Input Manual Metode */}
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Atau Ketik / Tambah Metode Pembelajaran Manual:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customMetodeInput}
                      onChange={(e) => setCustomMetodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomItem(metodeList, setMetodeList, customMetodeInput, () => setCustomMetodeInput(''));
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 shadow-2xs"
                      placeholder="Ketik nama metode lalu tekan Enter atau klik Tambah..."
                    />
                    <button
                      type="button"
                      onClick={() => addCustomItem(metodeList, setMetodeList, customMetodeInput, () => setCustomMetodeInput(''))}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah</span>
                    </button>
                  </div>
                </div>

                {/* Selected Methods Badges */}
                <div className="pt-2">
                  <span className="text-[11px] text-slate-500 font-semibold block mb-1">
                    Daftar Metode yang Dipilih ({metodeList.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {metodeList.map((m) => (
                      <span
                        key={m}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-300 text-[11px] font-bold"
                      >
                        <span>{m}</span>
                        <button
                          type="button"
                          onClick={() => removeItem(metodeList, setMetodeList, m)}
                          className="text-blue-600 hover:text-rose-600 p-0.5 cursor-pointer"
                          title="Hapus metode ini"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MITRA PEMBELAJARAN */}
          {modalTab === 'mitra' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 space-y-1">
                <h4 className="font-bold text-purple-950 flex items-center gap-1.5 text-xs">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Mitra Pembelajaran (Internal &amp; Eksternal)</span>
                </h4>
                <p className="text-[11px] text-purple-900">
                  User berhak menentukan siapa mitra yang dipilih, apakah Internal, Eksternal, atau keduanya. 
                  <strong className="block text-purple-950 mt-0.5">
                    ⚠️ Aturan Ketat: Jika mitra tidak dipilih, bagian tersebut TIDAK AKAN DITAMPILKAN pada dokumen RPM!
                  </strong>
                </p>
              </div>

              {/* MITRA INTERNAL */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="toggle-internal"
                      checked={useMitraInternal}
                      onChange={(e) => setUseMitraInternal(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="toggle-internal" className="font-bold text-slate-900 text-xs cursor-pointer">
                      Gunakan Mitra Internal
                    </label>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    useMitraInternal ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {useMitraInternal ? 'Aktif Ditampilkan' : 'Tidak Ditampilkan'}
                  </span>
                </div>

                {useMitraInternal && (
                  <div className="space-y-2 pt-1 pl-6">
                    <div className="grid sm:grid-cols-2 gap-2">
                      {PRESET_MITRA_INTERNAL.map((mi) => {
                        const isSelected = mitraInternalList.includes(mi);
                        return (
                          <button
                            key={mi}
                            type="button"
                            onClick={() => toggleItem(mitraInternalList, setMitraInternalList, mi)}
                            className={`p-2 rounded-lg border text-left flex items-center justify-between text-[11px] font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>{mi}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Input Internal */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={customMitraInternal}
                        onChange={(e) => setCustomMitraInternal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomItem(mitraInternalList, setMitraInternalList, customMitraInternal, () => setCustomMitraInternal(''));
                          }
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                        placeholder="Ketik mitra internal custom..."
                      />
                      <button
                        type="button"
                        onClick={() => addCustomItem(mitraInternalList, setMitraInternalList, customMitraInternal, () => setCustomMitraInternal(''))}
                        className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                      >
                        Tambah
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {mitraInternalList.map((m) => (
                        <span key={m} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-300 text-[10px] font-semibold text-slate-800">
                          <span>{m}</span>
                          <button type="button" onClick={() => removeItem(mitraInternalList, setMitraInternalList, m)} className="text-slate-400 hover:text-rose-600">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* MITRA EKSTERNAL */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="toggle-eksternal"
                      checked={useMitraEksternal}
                      onChange={(e) => setUseMitraEksternal(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="toggle-eksternal" className="font-bold text-slate-900 text-xs cursor-pointer">
                      Gunakan Mitra Eksternal
                    </label>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    useMitraEksternal ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {useMitraEksternal ? 'Aktif Ditampilkan' : 'Tidak Ditampilkan'}
                  </span>
                </div>

                {useMitraEksternal && (
                  <div className="space-y-2 pt-1 pl-6">
                    <div className="grid sm:grid-cols-2 gap-2">
                      {PRESET_MITRA_EKSTERNAL.map((me) => {
                        const isSelected = mitraEksternalList.includes(me);
                        return (
                          <button
                            key={me}
                            type="button"
                            onClick={() => toggleItem(mitraEksternalList, setMitraEksternalList, me)}
                            className={`p-2 rounded-lg border text-left flex items-center justify-between text-[11px] font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>{me}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Input Eksternal */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={customMitraEksternal}
                        onChange={(e) => setCustomMitraEksternal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomItem(mitraEksternalList, setMitraEksternalList, customMitraEksternal, () => setCustomMitraEksternal(''));
                          }
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                        placeholder="Ketik mitra eksternal custom..."
                      />
                      <button
                        type="button"
                        onClick={() => addCustomItem(mitraEksternalList, setMitraEksternalList, customMitraEksternal, () => setCustomMitraEksternal(''))}
                        className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                      >
                        Tambah
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {mitraEksternalList.map((m) => (
                        <span key={m} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-300 text-[10px] font-semibold text-slate-800">
                          <span>{m}</span>
                          <button type="button" onClick={() => removeItem(mitraEksternalList, setMitraEksternalList, m)} className="text-slate-400 hover:text-rose-600">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PEMANFAATAN DIGITAL */}
          {modalTab === 'digital' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-teal-950 flex items-center gap-1.5 text-xs">
                    <Laptop className="w-4 h-4 text-teal-600" />
                    <span>Pemanfaatan Digital &amp; Media Pembelajaran</span>
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="toggle-digital"
                      checked={useDigital}
                      onChange={(e) => setUseDigital(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="toggle-digital" className="text-xs font-bold text-teal-950 cursor-pointer">
                      Gunakan Digital &amp; Media
                    </label>
                  </div>
                </div>
                <p className="text-[11px] text-teal-900">
                  Pilih dari daftar yang tersedia, <strong>tambahkan secara manual</strong>, atau <strong>klik ikon pensil (Edit)</strong> untuk mengubah teks platform, perangkat, maupun media pembelajaran sesuai kebutuhan kelas Anda.
                </p>
              </div>

              {useDigital && (
                <div className="space-y-4">
                  {/* A. Platform & Aplikasi */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-bold text-slate-800 text-[11px] block">
                        A. Platform &amp; Aplikasi Digital:
                      </span>
                      <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                        Bisa Pilih Preset, Tambah Manual, atau Edit
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PRESET_PLATFORM.map((p) => {
                        const isSelected = platformList.includes(p);
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => toggleItem(platformList, setPlatformList, p)}
                            className={`p-2 rounded-lg border text-left flex items-center justify-between text-[11px] font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-teal-50 border-teal-400 text-teal-950 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">{p}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Input Manual Platform */}
                    <div className="pt-1">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Tambah Platform / Aplikasi Secara Manual:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customPlatform}
                          onChange={(e) => setCustomPlatform(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomItem(platformList, setPlatformList, customPlatform, () => setCustomPlatform(''));
                            }
                          }}
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 shadow-2xs"
                          placeholder="Ketik platform/aplikasi (misal: Kahoot, Wordwall, WhatsApp Grup, dll.) lalu klik Tambah..."
                        />
                        <button
                          type="button"
                          onClick={() => addCustomItem(platformList, setPlatformList, customPlatform, () => setCustomPlatform(''))}
                          className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah</span>
                        </button>
                      </div>
                    </div>

                    {/* Daftar Platform Terpilih (Bisa Diedit / Dihapus) */}
                    <div className="pt-1">
                      <span className="text-[11px] text-slate-500 font-semibold block mb-1.5">
                        Daftar Platform &amp; Aplikasi Terpilih ({platformList.length}) — Klik ikon pensil untuk mengedit:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {platformList.map((item, idx) => {
                          const isEditing =
                            editingDigitalItem?.category === 'platform' &&
                            editingDigitalItem?.index === idx;
                          if (isEditing) {
                            return (
                              <div
                                key={`edit-plat-${idx}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border-2 border-teal-500 shadow-xs"
                              >
                                <input
                                  type="text"
                                  value={editingDigitalItem.value}
                                  onChange={(e) =>
                                    setEditingDigitalItem({
                                      ...editingDigitalItem,
                                      value: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveEditedDigitalItem(platformList, setPlatformList);
                                    } else if (e.key === 'Escape') {
                                      setEditingDigitalItem(null);
                                    }
                                  }}
                                  className="px-1.5 py-0.5 text-[11px] font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-teal-500 w-44 sm:w-56"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditedDigitalItem(platformList, setPlatformList)}
                                  className="p-1 rounded bg-teal-600 text-white hover:bg-teal-700 cursor-pointer"
                                  title="Simpan perubahan"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingDigitalItem(null)}
                                  className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                                  title="Batal edit"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          }
                          return (
                            <span
                              key={`${item}-${idx}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-100 text-teal-950 border border-teal-300 text-[11px] font-bold"
                            >
                              <span>{item}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingDigitalItem({
                                    category: 'platform',
                                    index: idx,
                                    value: item,
                                  })
                                }
                                className="text-teal-700 hover:text-blue-700 p-0.5 cursor-pointer"
                                title="Edit item ini"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeItem(platformList, setPlatformList, item)}
                                className="text-teal-700 hover:text-rose-600 p-0.5 cursor-pointer"
                                title="Hapus item ini"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                        {platformList.length === 0 && (
                          <span className="text-[11px] text-slate-400 italic">
                            Belum ada platform yang dipilih.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* B. Perangkat Digital */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-bold text-slate-800 text-[11px] block">
                        B. Perangkat Digital / Sarana Pendukung:
                      </span>
                      <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                        Bisa Pilih Preset, Tambah Manual, atau Edit
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PRESET_PERANGKAT.map((pd) => {
                        const isSelected = perangkatList.includes(pd);
                        return (
                          <button
                            key={pd}
                            type="button"
                            onClick={() => toggleItem(perangkatList, setPerangkatList, pd)}
                            className={`p-2 rounded-lg border text-left flex items-center justify-between text-[11px] font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-teal-50 border-teal-400 text-teal-950 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">{pd}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Input Manual Perangkat */}
                    <div className="pt-1">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Tambah Perangkat Digital Secara Manual:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customPerangkat}
                          onChange={(e) => setCustomPerangkat(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomItem(perangkatList, setPerangkatList, customPerangkat, () => setCustomPerangkat(''));
                            }
                          }}
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 shadow-2xs"
                          placeholder="Ketik perangkat (misal: Smart TV, Tablet, Kamera, dll.) lalu klik Tambah..."
                        />
                        <button
                          type="button"
                          onClick={() => addCustomItem(perangkatList, setPerangkatList, customPerangkat, () => setCustomPerangkat(''))}
                          className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah</span>
                        </button>
                      </div>
                    </div>

                    {/* Daftar Perangkat Terpilih (Bisa Diedit / Dihapus) */}
                    <div className="pt-1">
                      <span className="text-[11px] text-slate-500 font-semibold block mb-1.5">
                        Daftar Perangkat Digital Terpilih ({perangkatList.length}) — Klik ikon pensil untuk mengedit:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {perangkatList.map((item, idx) => {
                          const isEditing =
                            editingDigitalItem?.category === 'perangkat' &&
                            editingDigitalItem?.index === idx;
                          if (isEditing) {
                            return (
                              <div
                                key={`edit-perangkat-${idx}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border-2 border-teal-500 shadow-xs"
                              >
                                <input
                                  type="text"
                                  value={editingDigitalItem.value}
                                  onChange={(e) =>
                                    setEditingDigitalItem({
                                      ...editingDigitalItem,
                                      value: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveEditedDigitalItem(perangkatList, setPerangkatList);
                                    } else if (e.key === 'Escape') {
                                      setEditingDigitalItem(null);
                                    }
                                  }}
                                  className="px-1.5 py-0.5 text-[11px] font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-teal-500 w-44 sm:w-56"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditedDigitalItem(perangkatList, setPerangkatList)}
                                  className="p-1 rounded bg-teal-600 text-white hover:bg-teal-700 cursor-pointer"
                                  title="Simpan perubahan"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingDigitalItem(null)}
                                  className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                                  title="Batal edit"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          }
                          return (
                            <span
                              key={`${item}-${idx}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-100 text-teal-950 border border-teal-300 text-[11px] font-bold"
                            >
                              <span>{item}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingDigitalItem({
                                    category: 'perangkat',
                                    index: idx,
                                    value: item,
                                  })
                                }
                                className="text-teal-700 hover:text-blue-700 p-0.5 cursor-pointer"
                                title="Edit item ini"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeItem(perangkatList, setPerangkatList, item)}
                                className="text-teal-700 hover:text-rose-600 p-0.5 cursor-pointer"
                                title="Hapus item ini"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                        {perangkatList.length === 0 && (
                          <span className="text-[11px] text-slate-400 italic">
                            Belum ada perangkat yang dipilih.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* C. Media Digital / Media Pembelajaran */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-bold text-slate-800 text-[11px] block">
                        C. Media Pembelajaran / Media Digital:
                      </span>
                      <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                        Bisa Pilih Preset, Tambah Manual, atau Edit
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PRESET_MEDIA.map((md) => {
                        const isSelected = mediaList.includes(md);
                        return (
                          <button
                            key={md}
                            type="button"
                            onClick={() => toggleItem(mediaList, setMediaList, md)}
                            className={`p-2 rounded-lg border text-left flex items-center justify-between text-[11px] font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-teal-50 border-teal-400 text-teal-950 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">{md}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Input Manual Media */}
                    <div className="pt-1">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Tambah Media Pembelajaran / Media Digital Secara Manual:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customMedia}
                          onChange={(e) => setCustomMedia(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomItem(mediaList, setMediaList, customMedia, () => setCustomMedia(''));
                            }
                          }}
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 shadow-2xs"
                          placeholder="Ketik media pembelajaran (misal: Kartu Bilangan, Poster Interaktif, Alat Peraga Konkret, dll.)..."
                        />
                        <button
                          type="button"
                          onClick={() => addCustomItem(mediaList, setMediaList, customMedia, () => setCustomMedia(''))}
                          className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah</span>
                        </button>
                      </div>
                    </div>

                    {/* Daftar Media Terpilih (Bisa Diedit / Dihapus) */}
                    <div className="pt-1">
                      <span className="text-[11px] text-slate-500 font-semibold block mb-1.5">
                        Daftar Media Pembelajaran Terpilih ({mediaList.length}) — Klik ikon pensil untuk mengedit:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {mediaList.map((item, idx) => {
                          const isEditing =
                            editingDigitalItem?.category === 'media' &&
                            editingDigitalItem?.index === idx;
                          if (isEditing) {
                            return (
                              <div
                                key={`edit-media-${idx}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border-2 border-teal-500 shadow-xs"
                              >
                                <input
                                  type="text"
                                  value={editingDigitalItem.value}
                                  onChange={(e) =>
                                    setEditingDigitalItem({
                                      ...editingDigitalItem,
                                      value: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveEditedDigitalItem(mediaList, setMediaList);
                                    } else if (e.key === 'Escape') {
                                      setEditingDigitalItem(null);
                                    }
                                  }}
                                  className="px-1.5 py-0.5 text-[11px] font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-teal-500 w-44 sm:w-56"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditedDigitalItem(mediaList, setMediaList)}
                                  className="p-1 rounded bg-teal-600 text-white hover:bg-teal-700 cursor-pointer"
                                  title="Simpan perubahan"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingDigitalItem(null)}
                                  className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                                  title="Batal edit"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          }
                          return (
                            <span
                              key={`${item}-${idx}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-100 text-teal-950 border border-teal-300 text-[11px] font-bold"
                            >
                              <span>{item}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingDigitalItem({
                                    category: 'media',
                                    index: idx,
                                    value: item,
                                  })
                                }
                                className="text-teal-700 hover:text-blue-700 p-0.5 cursor-pointer"
                                title="Edit item ini"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeItem(mediaList, setMediaList, item)}
                                className="text-teal-700 hover:text-rose-600 p-0.5 cursor-pointer"
                                title="Hapus item ini"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                        {mediaList.length === 0 && (
                          <span className="text-[11px] text-slate-400 italic">
                            Belum ada media yang dipilih.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: LINGKUNGAN, BUDAYA & PROFIL */}
          {modalTab === 'lingkungan' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                  <School className="w-4 h-4 text-emerald-600" />
                  <span>Lingkungan Belajar, Budaya Belajar &amp; Profil Lulusan</span>
                </h4>
                <p className="text-[11px] text-emerald-900">
                  Pastikan lingkungan fisik dan budaya belajar mendukung pengalaman belajar yang berkesadaran, bermakna, dan menyenangkan.
                </p>
              </div>

              {/* Dimensi Profil Lulusan */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-[11px] font-bold text-slate-800">
                  Dimensi Profil Lulusan (Minimal 3 DPL Sesuai Dokumen ATP):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_DPL.map((d) => {
                    const isSelected = dplList.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleItem(dplList, setDplList, d)}
                        className={`p-2 rounded-lg border text-left flex items-center justify-between text-[11px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-950 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{d}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lingkungan Fisik & Budaya */}
              <div className="grid sm:grid-cols-2 gap-3.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-800 text-[11px] block">
                    Lingkungan Fisik:
                  </span>
                  <div className="space-y-1">
                    {PRESET_LINGKUNGAN_FISIK.map((lf) => (
                      <label key={lf} className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={lingkunganFisikList.includes(lf)}
                          onChange={() => toggleItem(lingkunganFisikList, setLingkunganFisikList, lf)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{lf}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-800 text-[11px] block">
                    Budaya Belajar:
                  </span>
                  <div className="space-y-1">
                    {PRESET_BUDAYA_BELAJAR.map((bb) => (
                      <label key={bb} className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={budayaBelajarList.includes(bb)}
                          onChange={() => toggleItem(budayaBelajarList, setBudayaBelajarList, bb)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{bb}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Deskripsi Penataan Lingkungan Fisik Kelas */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <label className="font-bold text-slate-800 text-[11px] block">
                  Deskripsi / Formasi Penataan Ruang Belajar (Opsional):
                </label>
                <textarea
                  rows={2}
                  value={lingkunganFisikDeskripsi}
                  onChange={(e) => setLingkunganFisikDeskripsi(e.target.value)}
                  placeholder="Contoh: Ruang kelas ditata secara dinamis dengan formasi meja melingkar (4-5 murid per kelompok) untuk memfasilitasi interaksi aktif dan kolaborasi."
                  className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Ringkasan Kesiapan Dokumen RPM (Muncul setelah melengkapi Lingkungan Belajar) */}
              <div
                className={`p-4 rounded-xl border-2 transition-all ${
                  isAllComplete
                    ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-400 text-emerald-950 shadow-xs'
                    : 'bg-amber-50/80 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      isAllComplete
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {isAllComplete ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <h5 className="font-black text-xs sm:text-sm">
                        {isAllComplete
                          ? '🎉 Lingkungan Belajar Lengkap! Menu Buat Dokumen RPM Telah Terbuka'
                          : '⚠️ Lengkapi Pilihan Lingkungan Belajar Sebelum Membuat Dokumen'}
                      </h5>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/80 border border-slate-300 text-slate-700">
                        Langkah 5 dari 5 (Final)
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-700">
                      {isAllComplete
                        ? 'Seluruh pengaturan (TP, Metode, Mitra, Digital, dan Lingkungan Belajar) telah terisi secara terstruktur. Anda dapat langsung menekan tombol "Buat Dokumen RPM Sekarang" di bawah.'
                        : 'Harap pastikan minimal 1 Lingkungan Fisik, 1 Budaya Belajar, dan Dimensi Profil Lulusan terpilih agar tombol pembuatan dokumen RPM aktif.'}
                    </p>

                    {/* Status Indikator Setiap Langkah */}
                    <div className="pt-2 flex flex-wrap gap-1.5 text-[10px]">
                      <span
                        className={`px-2 py-1 rounded-md font-bold flex items-center gap-1 border ${
                          isStep1Complete
                            ? 'bg-emerald-100/90 text-emerald-800 border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                      >
                        {isStep1Complete ? '✓' : '✗'} 1. TP: {selectedTPs.length} Terpilih
                      </span>
                      <span
                        className={`px-2 py-1 rounded-md font-bold flex items-center gap-1 border ${
                          isStep2Complete
                            ? 'bg-emerald-100/90 text-emerald-800 border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                      >
                        {isStep2Complete ? '✓' : '✗'} 2. Metode: {metodeList.length} Terpilih
                      </span>
                      <span className="px-2 py-1 rounded-md font-bold flex items-center gap-1 border bg-slate-100 text-slate-700 border-slate-300">
                        3. Mitra: {useMitraInternal || useMitraEksternal ? 'Terkonfigurasi' : 'Opsional (Tidak Ada)'}
                      </span>
                      <span className="px-2 py-1 rounded-md font-bold flex items-center gap-1 border bg-slate-100 text-slate-700 border-slate-300">
                        4. Digital: {useDigital ? 'Aktif' : 'Non-aktif (Opsional)'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-md font-bold flex items-center gap-1 border ${
                          isStep5Complete
                            ? 'bg-emerald-100/90 text-emerald-800 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {isStep5Complete ? '✓' : '⚠️'} 5. Lingkungan: {lingkunganFisikList.length} Fisik • {budayaBelajarList.length} Budaya
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
              <span className="font-bold text-slate-700">
                {modalTab === 'tp' && 'Langkah 1/5 • TP & Kelas'}
                {modalTab === 'metode' && 'Langkah 2/5 • Metode'}
                {modalTab === 'mitra' && 'Langkah 3/5 • Kemitraan'}
                {modalTab === 'digital' && 'Langkah 4/5 • Digital'}
                {modalTab === 'lingkungan' && 'Langkah 5/5 • Lingkungan Belajar (Final)'}
              </span>
              <span>•</span>
              <span>{selectedTPs.length} TP</span>
              <span>•</span>
              <span>{metodeList.length} Metode</span>
              {modalTab === 'lingkungan' && (
                <>
                  <span>•</span>
                  <span className={isStep5Complete ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    Lingkungan: {lingkunganFisikList.length} Fisik, {budayaBelajarList.length} Budaya
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
              >
                Batal
              </button>

              {modalTab !== 'tp' && (
                <button
                  type="button"
                  onClick={goToPrevStep}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>
                    Kembali
                    {modalTab === 'metode' && ' ke TP'}
                    {modalTab === 'mitra' && ' ke Metode'}
                    {modalTab === 'digital' && ' ke Mitra'}
                    {modalTab === 'lingkungan' && ' ke Digital'}
                  </span>
                </button>
              )}

              {modalTab !== 'lingkungan' ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 border border-blue-500 shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <span>
                    {modalTab === 'tp' && 'Lanjut: Metode Pembelajaran'}
                    {modalTab === 'metode' && 'Lanjut: Mitra Pembelajaran'}
                    {modalTab === 'mitra' && 'Lanjut: Pemanfaatan Digital'}
                    {modalTab === 'digital' && 'Lanjut: Lengkapi Lingkungan Belajar'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading || !isAllComplete}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all flex items-center gap-2 ${
                    isAllComplete && !isLoading
                      ? 'text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 border-2 border-amber-300 shadow-amber-500/20 active:scale-[0.98] cursor-pointer'
                      : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                  }`}
                  title={!isAllComplete ? 'Lengkapi Lingkungan Belajar (Fisik, Budaya, dan Profil Lulusan)' : 'Klik untuk menyusun Modul Ajar / Dokumen RPM'}
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>{isLoading ? 'Menyusun Dokumen RPM...' : 'Buat Dokumen RPM Sekarang'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
