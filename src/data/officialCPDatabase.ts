import { PresetCP } from '../types';

export interface SubjectElementCP {
  id: string;
  elemen: string;
  capaianPembelajaran: string;
  deskripsiSingkat?: string;
  daftarKompetensiKunci?: string[];
  daftarLingkupMateriKunci?: string[];
}

export interface SubjectFolder {
  id: string;
  mataPelajaran: string;
  fase: 'Fase A' | 'Fase B' | 'Fase C';
  kelas: string;
  deskripsiMapel: string;
  elemenList: SubjectElementCP[];
}

// Backward compatibility item
export interface SubjectCPItem {
  id: string;
  mataPelajaran: string;
  fase: 'Fase A' | 'Fase B' | 'Fase C';
  kelas: string;
  elemen: string;
  subElemenList?: string[];
  deskripsiSingkat: string;
  capaianPembelajaran: string;
}

export const OFFICIAL_SUBJECT_FOLDERS: SubjectFolder[] = [
  // =========================================================================
  // 1. IPAS (ILMU PENGETAHUAN ALAM DAN SOSIAL) - FASE B (KELAS III & IV)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025 (Hanya Fase B & C)
  // =========================================================================
  {
    id: 'folder-ipas-fase-b',
    mataPelajaran: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)',
    fase: 'Fase B',
    kelas: 'III & IV (Tiga & Empat)',
    deskripsiMapel: 'Folder resmi IPAS Fase B (2 Elemen: Pemahaman IPAS & Keterampilan Proses) - BSKAP 046/2025',
    elemenList: [
      {
        id: 'ipas-fb-el-1',
        elemen: 'Pemahaman IPAS',
        deskripsiSingkat: 'Pancaindra, daur hidup, mitigasi iklim, wujud zat, energi, gaya, interaksi sosial, peta, bentang alam, sejarah lokal, uang',
        capaianPembelajaran: `Menjelaskan bentuk dan fungsi pancaindra; menganalisis siklus hidup makhluk hidup dan upaya pelestariannya; menghasilkan solusi untuk masalah yang berkaitan dengan pelestarian sumber daya alam sebagai upaya mitigasi perubahan iklim; menyimpulkan proses perubahan wujud zat; menjelaskan sumber dan bentuk energi, serta proses perubahan bentuk energi dalam kehidupan sehari-hari; membedakan jenis gaya dan pengaruhnya terhadap arah, gerak, dan bentuk benda; menjelaskan peran, tugas, dan tanggung jawab serta interaksi sosial yang terjadi di sekitar tempat tinggal dan sekolah; mengenali letak kabupaten/kota dan provinsi tempat tinggalnya dengan menggunakan peta konvensional/digital; mengklasifikasikan ragam bentang alam dan keterkaitannya dengan profesi masyarakat, ragam budaya serta upaya untuk melestarikannya; menganalisis sejarah masyarakat di lingkungan tempat tinggal; menjelaskan nilai mata uang dan fungsinya, serta cara mengelola keuangan secara bijak.`
      },
      {
        id: 'ipas-fb-el-2',
        elemen: 'Keterampilan Proses',
        deskripsiSingkat: 'Mengamati, mempertanyakan & memprediksi, merencanakan penyelidikan, memproses data turus/diagram, refleksi, komunikasi',
        capaianPembelajaran: `Mengamati: Murid mengamati fenomena dan peristiwa secara sederhana dan dapat mencatat hasil pengamatannya. Mempertanyakan dan Memprediksi: Secara mandiri, murid mengajukan pertanyaan tentang hal-hal yang ingin diketahui saat melakukan pengamatan dan membuat prediksi berdasarkan pengetahuan yang dimiliki sebelumnya. Merencanakan dan Melakukan Penyelidikan: Dengan panduan pendidik, murid membuat rencana dan melakukan langkah-langkah operasional untuk menjawab pertanyaan yang diajukan. Murid melakukan observasi menggunakan alat bantu pengukuran sederhana. Memproses, Menganalisis Data dan Informasi: Dengan panduan pendidik, murid mengorganisasikan data dalam bentuk turus dan diagram gambar untuk menyajikan dan mengidentifikasi pola. Murid membandingkan antara hasil pengamatan dengan prediksi dan memberikan penjelasan. Mengevaluasi dan Refleksi: Murid melakukan refleksi terhadap penyelidikan yang sudah dilakukan. Mengomunikasikan Hasil: Murid mengomunikasikan hasil penyelidikan secara lisan dan tertulis dalam berbagai media.`
      }
    ]
  },

  // =========================================================================
  // 2. IPAS (ILMU PENGETAHUAN ALAM DAN SOSIAL) - FASE C (KELAS V & VI)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025 (Hanya Fase B & C)
  // =========================================================================
  {
    id: 'folder-ipas-fase-c',
    mataPelajaran: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)',
    fase: 'Fase C',
    kelas: 'V & VI (Lima & Enam)',
    deskripsiMapel: 'Folder resmi IPAS Fase C (2 Elemen: Pemahaman IPAS & Keterampilan Proses) - BSKAP 046/2025',
    elemenList: [
      {
        id: 'ipas-fc-el-1',
        elemen: 'Pemahaman IPAS',
        deskripsiSingkat: 'Organ tubuh manusia, ekosistem, gelombang bunyi & cahaya, energi alternatif, tata surya, geografis RI, pahlawan & keragaman budaya, kegiatan ekonomi',
        capaianPembelajaran: `Merefleksikan sistem organ tubuh manusia yang dikaitkan dengan cara menjaga kesehatan tubuhnya; menganalisis hubungan antar komponen biotik dan abiotik, serta pengaruhnya terhadap ekosistem; menjelaskan fenomena gelombang bunyi dan cahaya dalam kehidupan sehari-hari; menghasilkan upaya penghematan energi, serta pemanfaatan sumber energi alternatif dari sumber daya yang ada di sekitarnya sebagai upaya mitigasi perubahan iklim; menjelaskan sistem tata surya, serta kaitannya dengan rotasi dan revolusi bumi; menjelaskan letak dan kondisi geografis negara Indonesia dengan menggunakan peta konvensional/digital; meninjau sejarah perjuangan para pahlawan di lingkungan sekitar tempat tinggalnya; menemukan keragaman budaya nasional dalam konteks kebhinekaan berdasarkan pemahaman terhadap nilai-nilai kearifan lokal yang berlaku di wilayah tempat tinggal; serta menerapkan kegiatan ekonomi masyarakat di lingkungan sekitar.`
      },
      {
        id: 'ipas-fc-el-2',
        elemen: 'Keterampilan Proses',
        deskripsiSingkat: 'Observasi terarah, pertanyaan ilmiah, penyelidikan mandiri, pengolahan tabel & grafik, refleksi & saran perbaikan, komunikasi argumen',
        capaianPembelajaran: `Mengamati: Murid mengamati fenomena dan peristiwa secara sederhana, mencatat hasil pengamatannya, serta mencari persamaan dan perbedaannya. Mempertanyakan dan Memprediksi: Dengan panduan pendidik, murid mengidentifikasi pertanyaan yang dapat diselidiki secara ilmiah dan membuat prediksinya. Merencanakan dan Melakukan Penyelidikan: Secara mandiri, murid merencanakan dan melakukan langkah-langkah operasional untuk menjawab pertanyaan yang diajukan. Murid melakukan observasi menggunakan alat bantu pengukuran sederhana. Memproses serta Menganalisis Data dan Informasi: Murid mengolah data dalam bentuk tabel dan grafik, serta menjelaskan hasil pengamatan dan pola atau hubungan pada data. Murid membandingkan data dengan prediksi dan memberikan alasan berdasarkan bukti. Mengevaluasi dan Refleksi: Melakukan refleksi dan memberikan saran perbaikan terhadap penyelidikan yang sudah dilakukan. Mengomunikasikan Hasil: Murid mengomunikasikan hasil penyelidikan secara utuh yang ditunjang dengan argumen dalam berbagai media.`
      }
    ]
  },

  // =========================================================================
  // 3. BAHASA INDONESIA - FASE A (KELAS I & II)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  {
    id: 'folder-b-indo-fase-a',
    mataPelajaran: 'Bahasa Indonesia',
    fase: 'Fase A',
    kelas: 'I & II (Satu & Dua)',
    deskripsiMapel: 'Folder resmi Bahasa Indonesia Fase A (4 Elemen: Menyimak, Membaca-Memirsa, Berbicara-Mempresentasikan, Menulis) - BSKAP 046/2025',
    elemenList: [
      {
        id: 'bindo-fa-el-1',
        elemen: 'Menyimak',
        deskripsiSingkat: 'Informasi teks nonsastra aural (percakapan diri, keluarga, lingkungan sekitar) & pesan teks sastra aural',
        capaianPembelajaran: `Memahami informasi dari teks nonsastra berbentuk teks aural (teks yang dibacakan dan/atau didengarkan) berupa percakapan yang berkaitan dengan diri, keluarga, dan/atau lingkungan sekitar; dan memahami pesan teks sastra berbentuk teks aural.`
      },
      {
        id: 'bindo-fa-el-2',
        elemen: 'Membaca dan Memirsa',
        deskripsiSingkat: 'Membaca fasih kata sederhana & memahami isi bacaan/tayangan tentang diri, keluarga, kesehatan, lingkungan',
        capaianPembelajaran: `Membaca kata-kata sederhana dengan fasih dari bacaan dan/atau tayangan yang dipirsa tentang diri, keluarga, kesehatan, dan/atau lingkungan sekitar; dan memahami isi bacaan dan/atau tayangan yang dipirsa tentang diri, keluarga, kesehatan, dan/atau lingkungan sekitar.`
      },
      {
        id: 'bindo-fa-el-3',
        elemen: 'Berbicara dan Mempresentasikan',
        deskripsiSingkat: 'Merespons tanya-jawab santun, mengungkapkan perasaan/gagasan lisan, menceritakan kembali isi teks',
        capaianPembelajaran: `Merespons dengan bertanya tentang sesuatu, menjawab, dan menanggapi komentar orang lain (teman, pendidik, dan/atau orang dewasa) dengan baik dan santun dalam suatu percakapan tentang diri, keluarga, kesehatan, dan/atau lingkungan sekitar; mengungkapkan perasaan dan gagasan secara lisan dengan atau tanpa bantuan gambar; dan menceritakan kembali isi berbagai tipe teks yang dibaca, dipirsa, atau didengar tentang diri, keluarga, kesehatan, dan/atau lingkungan sekitar.`
      },
      {
        id: 'bindo-fa-el-4',
        elemen: 'Menulis',
        deskripsiSingkat: 'Menulis permulaan benar kertas/digital, tulisan tangan makin baik, teks sederhana beberapa kalimat',
        capaianPembelajaran: `Menulis permulaan dengan benar di atas kertas dan/atau melalui media digital; mengembangkan tulisan tangan yang semakin baik; dan menulis berbagai tipe teks sederhana tentang diri, keluarga, dan/atau lingkungan sekitar dengan beberapa kalimat sederhana.`
      }
    ]
  },

  // =========================================================================
  // 4. BAHASA INDONESIA - FASE B (KELAS III & IV)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  {
    id: 'folder-b-indo-fase-b',
    mataPelajaran: 'Bahasa Indonesia',
    fase: 'Fase B',
    kelas: 'III & IV (Tiga & Empat)',
    deskripsiMapel: 'Folder resmi Bahasa Indonesia Fase B (4 Elemen: Menyimak, Membaca-Memirsa, Berbicara-Mempresentasikan, Menulis) - BSKAP 046/2025',
    elemenList: [
      {
        id: 'bindo-fb-el-1',
        elemen: 'Menyimak',
        deskripsiSingkat: 'Ide pokok informasi teks nonsastra aural & isi teks sastra aural',
        capaianPembelajaran: `Memahami ide pokok suatu informasi dari teks nonsastra berbentuk teks aural (teks yang dibacakan dan/atau didengarkan); dan memahami isi teks sastra berbentuk teks aural.`
      },
      {
        id: 'bindo-fb-el-2',
        elemen: 'Membaca dan Memirsa',
        deskripsiSingkat: 'Membaca fasih kata baru, ide pokok/pendukung, pesan teks sastra & nonsastra cetak/elektronik',
        capaianPembelajaran: `Membaca kata-kata baru dengan fasih dari bacaan dan/atau tayangan yang dipirsa; dan memahami ide pokok, ide pendukung, pesan, dan informasi dalam teks sastra dan nonsastra berbentuk cetak dan/atau elektronik.`
      },
      {
        id: 'bindo-fb-el-3',
        elemen: 'Berbicara dan Mempresentasikan',
        deskripsiSingkat: 'Pendapat dengan gestur/intonasi tepat, menanggapi diskusi, menceritakan kembali isi/informasi teks',
        capaianPembelajaran: `Menyajikan pendapat dengan pilihan kata dan sikap tubuh/gestur yang sesuai, menggunakan volume dan intonasi yang tepat sesuai konteks; menanggapi diskusi sesuai tata cara; dan menceritakan kembali isi dan/atau informasi dari berbagai tipe teks yang dibaca, dipirsa, atau didengar.`
      },
      {
        id: 'bindo-fb-el-4',
        elemen: 'Menulis',
        deskripsiSingkat: 'Menulis teks sederhana kalimat beragam, kaidah kebahasaan & kosakata denotatif sesuai konteks',
        capaianPembelajaran: `Menulis berbagai tipe teks sederhana dengan rangkaian kalimat yang beragam; dan menggunakan kaidah kebahasaan dan kosakata baru yang memiliki makna denotatif untuk menulis teks sesuai dengan konteks.`
      }
    ]
  },

  // =========================================================================
  // 5. BAHASA INDONESIA - FASE C (KELAS V & VI)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  {
    id: 'folder-b-indo-fase-c',
    mataPelajaran: 'Bahasa Indonesia',
    fase: 'Fase C',
    kelas: 'V & VI (Lima & Enam)',
    deskripsiMapel: 'Folder resmi Bahasa Indonesia Fase C (4 Elemen: Menyimak, Membaca-Memirsa, Berbicara-Mempresentasikan, Menulis) - BSKAP 046/2025',
    elemenList: [
      {
        id: 'bindo-fc-el-1',
        elemen: 'Menyimak',
        deskripsiSingkat: 'Menganalisis informasi teks nonsastra aural & menganalisis isi teks sastra aural',
        capaianPembelajaran: `Menganalisis informasi dari teks nonsastra berbentuk teks aural (teks yang dibacakan dan/atau didengarkan; dan menganalisis isi teks sastra berbentuk teks aural.`
      },
      {
        id: 'bindo-fc-el-2',
        elemen: 'Membaca dan Memirsa',
        deskripsiSingkat: 'Pola kombinasi huruf fasih, menganalisis informasi & nilai teks sastra/nonsastra visual/audiovisual',
        capaianPembelajaran: `Membaca kata-kata dengan berbagai pola kombinasi huruf dengan fasih dari bacaan dan/atau tayangan yang dipirsa; dan menganalisis informasi serta nilai-nilai dalam teks sastra dan nonsastra berwujud teks visual dan/atau audiovisual.`
      },
      {
        id: 'bindo-fc-el-3',
        elemen: 'Berbicara dan Mempresentasikan',
        deskripsiSingkat: 'Mempresentasikan gagasan efektif/santun, menyampaikan perasaan fakta/imajinasi indah dalam teks sastra',
        capaianPembelajaran: `Mempresentasikan gagasan dari berbagai tipe teks dengan efektif dan santun; dan menyampaikan perasaan berdasarkan fakta, imajinasi (dari diri sendiri dan orang lain) secara indah dan menarik dalam bentuk teks sastra dengan penggunaan kosakata secara kreatif.`
      },
      {
        id: 'bindo-fc-el-4',
        elemen: 'Menulis',
        deskripsiSingkat: 'Menulis teks gagasan/pengamatan kalimat kompleks kreatif, kaidah kebahasaan, makna denotatif & konotatif',
        capaianPembelajaran: `Menulis berbagai tipe teks sederhana berdasarkan gagasan, hasil pengamatan, pengalaman, dan/atau imajinasi dengan rangkaian kalimat kompleks secara kreatif, menarik, dan/atau indah; dan menggunakan kaidah kebahasaan dan kosakata baru yang memiliki makna denotatif dan konotatif.`
      }
    ]
  },

  // =========================================================================
  // 6. MATEMATIKA - FASE A (KELAS I & II)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  {
    id: 'folder-matematika-fase-a',
    mataPelajaran: 'Matematika',
    fase: 'Fase A',
    kelas: 'I & II (Satu & Dua)',
    deskripsiMapel: 'Folder resmi Matematika Fase A (5 Elemen: Bilangan, Aljabar, Pengukuran, Geometri, Analisis Data dan Peluang) - BSKAP 046/2025',
    elemenList: [
      {
        id: 'mat-fa-el-1',
        elemen: 'Bilangan',
        deskripsiSingkat: 'Number sense cacah s.d 100, nilai tempat, penjumlahan & pengurangan konkret s.d 20, pecahan 1/2 & 1/4',
        capaianPembelajaran: `Menunjukkan pemahaman dan memiliki intuisi bilangan (number sense) pada bilangan cacah sampai 100; membaca, menulis, menentukan nilai tempat, membandingkan, mengurutkan, serta melakukan komposisi (menyusun) dan dekomposisi (mengurai) bilangan; melakukan operasi penjumlahan dan pengurangan menggunakan benda-benda konkret yang banyaknya sampai 20; dan menunjukkan pemahaman pecahan sebagai bagian dari keseluruhan melalui konteks membagi sebuah benda atau kumpulan benda sama banyak (pecahan yang diperkenalkan adalah setengah dan seperempat).`
      },
      {
        id: 'mat-fa-el-2',
        elemen: 'Aljabar',
        deskripsiSingkat: 'Makna simbol =, penjumlahan & pengurangan bilangan cacah s.d 20 gambar, pola bukan bilangan',
        capaianPembelajaran: `Menunjukan pemahaman makna simbol matematika "=" dalam suatu kalimat matematika yang terkait dengan penjumlahan dan pengurangan bilangan cacah sampai 20 menggunakan gambar. Murid dapat mengenali, meniru, dan melanjutkan pola bukan bilangan (misalnya, gambar, warna, bunyi/suara).`
      },
      {
        id: 'mat-fa-el-3',
        elemen: 'Pengukuran',
        deskripsiSingkat: 'Membandingkan panjang & berat secara langsung, durasi waktu, mengukur/mengestimasi satuan tidak baku',
        capaianPembelajaran: `Membandingkan panjang dan berat benda secara langsung, dan membandingkan durasi waktu; mengukur dan mengestimasi panjang dan berat benda menggunakan satuan tidak baku.`
      },
      {
        id: 'mat-fa-el-4',
        elemen: 'Geometri',
        deskripsiSingkat: 'Bangun datar & bangun ruang, komposisi & dekomposisi bangun datar, posisi benda terhadap benda lain',
        capaianPembelajaran: `Mengenal berbagai bangun datar (segitiga, segiempat, segi banyak, lingkaran) dan bangun ruang (balok, kubus, kerucut, dan bola); melakukan komposisi (penyusunan) dan dekomposisi (penguraian) suatu bangun datar (segitiga, segiempat, dan segi banyak); dan menentukan posisi benda terhadap benda lain (kanan, kiri, depan belakang, bawah, atas).`
      },
      {
        id: 'mat-fa-el-5',
        elemen: 'Analisis Data dan Peluang',
        deskripsiSingkat: 'Mengurutkan, menyortir, mengelompokkan, membandingkan, & menyajikan data turus dan piktogram s.d 4 kategori',
        capaianPembelajaran: `Mengurutkan, menyortir, mengelompokkan, membandingkan, dan menyajikan data dari banyak benda dengan menggunakan turus dan piktogram paling banyak 4 kategori.`
      }
    ]
  },

  // =========================================================================
  // 7. MATEMATIKA - FASE B (KELAS III & IV)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  {
    id: 'folder-matematika-fase-b',
    mataPelajaran: 'Matematika',
    fase: 'Fase B',
    kelas: 'III & IV (Tiga & Empat)',
    deskripsiMapel: 'Folder resmi Matematika Fase B (5 Elemen: Bilangan, Aljabar, Pengukuran, Geometri, Analisis Data dan Peluang) - BSKAP 046/2025',
    elemenList: [
      {
        id: 'mat-fb-el-1',
        elemen: 'Bilangan',
        deskripsiSingkat: 'Number sense s.d 10.000, operasi tambah/kurang s.d 1.000, kali/bagi s.d 100, faktor/kelipatan, pecahan senilai, desimal & persen',
        capaianPembelajaran: `Memiliki pemahaman dan intuisi bilangan (number sense) pada bilangan cacah sampai 10.000; membaca, menulis, membandingkan, dan mengurutkan bilangan; menentukan dan menggunakan nilai tempat; melakukan komposisi dan dekomposisi bilangan cacah sampai 10.000.
Murid dapat melakukan dan menyelesaikan masalah operasi bilangan penjumlahan dan pengurangan bilangan cacah sampai 1.000; melakukan dan menyelesaikan masalah operasi perkalian dan pembagian bilangan cacah sampai 100 dengan bantuan benda konkret, gambar dan simbol; mengenal kelipatan dan faktor.
Murid dapat melakukan perbandingan dan pengurutan pecahan dengan pembilang satu dan antar pecahan dengan penyebut yang sama; mengenal dan dapat menerapkan pecahan senilai, memiliki intuisi pecahan dan desimal, serta dapat menentukan pecahan sebagai desimal dan persen.`
      },
      {
        id: 'mat-fb-el-2',
        elemen: 'Aljabar',
        deskripsiSingkat: 'Nilai tidak diketahui dalam kalimat matematika s.d 100, pola gambar & pola bilangan membesar/mengecil',
        capaianPembelajaran: `Menemukan nilai yang tidak diketahui dalam kalimat matematika yang melibatkan penjumlahan dan pengurangan pada bilangan cacah sampai 100, dengan menggunakan sifat-sifat bilangan dan operasinya.
Murid dapat mengidentifikasi, meniru, dan mengembangkan pola gambar atau objek sederhana dan pola bilangan membesar dan mengecil yang dapat melibatkan penjumlahan dan pengurangan pada bilangan cacah sampai 100.`
      },
      {
        id: 'mat-fb-el-3',
        elemen: 'Pengukuran',
        deskripsiSingkat: 'Panjang & berat satuan baku (cm, m, g, kg), luas & volume satuan tidak baku dan satuan baku',
        capaianPembelajaran: `Mengukur panjang dan berat benda menggunakan satuan baku; menentukan hubungan antar-satuan baku panjang (cm, m) dan antar-satuan berat (g, kg); serta mengukur dan mengestimasi luas dan volume menggunakan satuan tidak baku dan satuan baku berupa bilangan cacah.`
      },
      {
        id: 'mat-fb-el-4',
        elemen: 'Geometri',
        deskripsiSingkat: 'Ciri bangun datar (segiempat, segitiga, segi banyak), komposisi & dekomposisi bangun datar',
        capaianPembelajaran: `Mendeskripsikan ciri berbagai bentuk bangun datar (segiempat, segitiga, segi banyak); menyusun (komposisi) dan mengurai (dekomposisi) berbagai bangun datar dengan lebih dari satu cara jika memungkinkan.`
      },
      {
        id: 'mat-fb-el-5',
        elemen: 'Analisis Data dan Peluang',
        deskripsiSingkat: 'Data dalam bentuk tabel, diagram gambar, piktogram, dan diagram batang skala satu satuan',
        capaianPembelajaran: `Mengurutkan, membandingkan, menyajikan, menganalisis dan menginterpretasi data dalam bentuk tabel, diagram gambar, piktogram, dan diagram batang (skala satu satuan).`
      }
    ]
  },

  // =========================================================================
  // 8. MATEMATIKA - FASE C (KELAS V & VI)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  {
    id: 'folder-matematika-fase-c',
    mataPelajaran: 'Matematika',
    fase: 'Fase C',
    kelas: 'V & VI (Lima & Enam)',
    deskripsiMapel: 'Folder resmi Matematika Fase C (5 Elemen: Bilangan, Aljabar, Pengukuran, Geometri, Analisis Data dan Peluang) - BSKAP 046/2025',
    elemenList: [
      {
        id: 'mat-fc-el-1',
        elemen: 'Bilangan',
        deskripsiSingkat: 'Number sense s.d 1.000.000, operasi s.d 100.000, uang, KPK & FPB, pecahan campuran, kali/bagi pecahan bilangan asli, desimal',
        capaianPembelajaran: `Menunjukkan pemahaman dan intuisi bilangan (number sense) pada bilangan cacah sampai 1.000.000; membaca, menulis, menentukan nilai tempat, membandingkan, mengurutkan, melakukan komposisi dan dekomposisi bilangan; menyelesaikan masalah yang berkaitan dengan uang; melakukan operasi penjumlahan, pengurangan, perkalian, dan pembagian bilangan cacah sampai 100.000; serta menyelesaikan masalah yang berkaitan dengan KPK dan FPB.
Murid dapat membandingkan dan mengurutkan berbagai pecahan termasuk pecahan campuran, melakukan operasi penjumlahan dan pengurangan pecahan, serta melakukan operasi perkalian dan pembagian pecahan dengan bilangan asli; mengubah pecahan menjadi berbagai bentuk pecahan lain, serta membandingkan dan mengurutkan bilangan desimal (satu angka di belakang koma).`
      },
      {
        id: 'mat-fc-el-2',
        elemen: 'Aljabar',
        deskripsiSingkat: 'Kalimat matematika bilangan cacah s.d 1000, pola bilangan membesar/mengecil, rasio satuan, dan proporsi sehari-hari',
        capaianPembelajaran: `Menemukan nilai yang belum diketahui dalam kalimat matematika yang melibatkan penjumlahan, pengurangan, perkalian, dan pembagian pada bilangan cacah sampai 1000 dengan menggunakan sifat-sifat bilangan dan operasinya.
Murid dapat mengidentifikasi, meniru, dan mengembangkan pola bilangan membesar dan mengecil yang melibatkan perkalian dan pembagian; bernalar secara proporsional untuk menyelesaikan masalah sehari-hari dengan rasio satuan; menggunakan operasi perkalian dan pembagian dalam menyelesaikan masalah sehari-hari yang terkait dengan proporsi.`
      },
      {
        id: 'mat-fc-el-3',
        elemen: 'Pengukuran',
        deskripsiSingkat: 'Keliling & luas bangun datar serta gabungannya, durasi waktu, pengukuran besar sudut',
        capaianPembelajaran: `Menentukan keliling dan luas berbagai bentuk bangun datar (segitiga, segiempat, dan segi banyak) serta gabungannya; menghitung durasi waktu dan mengukur besar sudut pada bangun datar atau yang dibentuk dari dua garis berpotongan.`
      },
      {
        id: 'mat-fc-el-4',
        elemen: 'Geometri',
        deskripsiSingkat: 'Konstruksi & dekonstruksi kubus/balok & gabungannya, visualisasi spasial, karakteristik bangun, peta sistem berpetak',
        capaianPembelajaran: `Mengkonstruksi dan mengurai bangun ruang (kubus, balok, dan gabungannya) dan mengenali visualisasi spasial (bagian depan, atas, dan samping); membandingkan karakteristik antar bangun datar dan antar bangun ruang; serta menentukan lokasi pada peta yang menggunakan sistem berpetak.`
      },
      {
        id: 'mat-fc-el-5',
        elemen: 'Analisis Data dan Peluang',
        deskripsiSingkat: 'Pengurutan, penyajian (piktogram, diagram batang, tabel frekuensi), analisis data, kemungkinan percobaan acak',
        capaianPembelajaran: `Mengurutkan, membandingkan, menyajikan, dan menganalisis data banyak benda dan data hasil pengukuran dalam bentuk gambar, piktogram, diagram batang, dan tabel frekuensi untuk mendapatkan informasi; menentukan kejadian dengan kemungkinan yang lebih besar atau lebih kecil dalam suatu percobaan acak.`
      }
    ]
  },

  // =========================================================================
  // 9. PENDIDIKAN PANCASILA - FASE A (KELAS I & II)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  {
    id: 'folder-pancasila-fase-a',
    mataPelajaran: 'Pendidikan Pancasila',
    fase: 'Fase A',
    kelas: 'I & II (Satu & Dua)',
    deskripsiMapel: 'Folder resmi Pendidikan Pancasila Fase A (4 Elemen: Pancasila, UUD NRI 1945, Bhinneka Tunggal Ika, NKRI) - BSKAP 046/2025',
    elemenList: [
      {
        id: 'pancasila-fa-el-1',
        elemen: 'Pancasila',
        deskripsiSingkat: 'Mengenal bendera negara, lagu kebangsaan, simbol dan sila-sila Pancasila dalam lambang negara Garuda Pancasila',
        capaianPembelajaran: `Mengenal bendera negara, lagu kebangsaan, simbol dan sila-sila Pancasila dalam lambang negara Garuda Pancasila dan simbol Pancasila beserta sila-sila Pancasila; menerapkan nilai-nilai Pancasila di lingkungan keluarga.`
      },
      {
        id: 'pancasila-fa-el-2',
        elemen: 'Undang-Undang Dasar Negara Republik Indonesia Tahun 1945',
        deskripsiSingkat: 'Mengenal aturan di lingkungan keluarga, mematuhi aturan keluarga',
        capaianPembelajaran: `Mengenal aturan di lingkungan keluarga; menunjukkan dan menceritakan sikap mematuhi aturan di lingkungan keluarga.`
      },
      {
        id: 'pancasila-fa-el-3',
        elemen: 'Bhinneka Tunggal Ika',
        deskripsiSingkat: 'Mengenal semboyan Bhinneka Tunggal Ika, menghargai identitas diri dan keberagaman sekitar',
        capaianPembelajaran: `Mengenal semboyan Bhinneka Tunggal Ika; mengidentifikasi dan menghargai identitas dirinya sesuai dengan jenis kelamin, hobi, bahasa, serta agama dan kepercayaan di lingkungan sekitar.`
      },
      {
        id: 'pancasila-fa-el-4',
        elemen: 'Negara Kesatuan Republik Indonesia',
        deskripsiSingkat: 'Karakteristik lingkungan tempat tinggal dan sekolah, bekerja sama menjaga lingkungan dalam keberagaman',
        capaianPembelajaran: `Mengenal karakteristik lingkungan tempat tinggal dan sekolah, sebagai bagian dari wilayah Negara Kesatuan Republik Indonesia; menceritakan dan mempraktikkan bekerja sama menjaga lingkungan sekitar dalam keberagaman.`
      }
    ]
  },

  // =========================================================================
  // 10. PENDIDIKAN PANCASILA - FASE B (KELAS III & IV)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  {
    id: 'folder-pancasila-fase-b',
    mataPelajaran: 'Pendidikan Pancasila',
    fase: 'Fase B',
    kelas: 'III & IV (Tiga & Empat)',
    deskripsiMapel: 'Folder resmi Pendidikan Pancasila Fase B (4 Elemen: Pancasila, UUD NRI 1945, Bhinneka Tunggal Ika, NKRI) - BSKAP 046/2025',
    elemenList: [
      {
        id: 'pancasila-fb-el-1',
        elemen: 'Pancasila',
        deskripsiSingkat: 'Makna sila-sila Pancasila, karakter para perumus Pancasila, bangga berbahasa Indonesia',
        capaianPembelajaran: `Mengidentifikasi makna sila-sila Pancasila, dan penerapannya dalam kehidupan sehari-hari; mengenal karakter para perumus Pancasila; menunjukkan sikap bangga menjadi anak Indonesia yang memiliki bahasa Indonesia sebagai bahasa persatuan di lingkungan sekitar.`
      },
      {
        id: 'pancasila-fb-el-2',
        elemen: 'Undang-Undang Dasar Negara Republik Indonesia Tahun 1945',
        deskripsiSingkat: 'Aturan di sekolah dan tempat tinggal, hak dan kewajiban anggota keluarga dan warga sekolah',
        capaianPembelajaran: `Mengidentifikasi dan melaksanakan aturan di sekolah dan lingkungan tempat tinggal; mengidentifikasi dan menerapkan hak yang didapat dan kewajiban sebagai anggota keluarga dan sebagai warga sekolah.`
      },
      {
        id: 'pancasila-fb-el-3',
        elemen: 'Bhinneka Tunggal Ika',
        deskripsiSingkat: 'Membedakan dan menghargai identitas sesuai budaya, suku, bahasa, agama di lingkungan sekitar',
        capaianPembelajaran: `Membedakan dan menghargai identitas, keluarga, dan teman-temannya sesuai budaya, suku bangsa, bahasa, agama dan kepercayaannya di lingkungan sekitar.`
      },
      {
        id: 'pancasila-fb-el-4',
        elemen: 'Negara Kesatuan Republik Indonesia',
        deskripsiSingkat: 'Lingkungan tempat tinggal (RT, RW, desa/kelurahan, kecamatan), bekerja sama dalam keberagaman',
        capaianPembelajaran: `Mengidentifikasi lingkungan tempat tinggal (RT, RW, desa atau kelurahan, dan kecamatan) sebagai bagian dari wilayah Negara Kesatuan Republik Indonesia; menunjukkan perilaku bekerja sama dalam berbagai bentuk keberagaman suku bangsa, sosial, dan budaya di Indonesia yang terikat persatuan dan kesatuan di lingkungan sekitar.`
      }
    ]
  },

  // =========================================================================
  // 11. PENDIDIKAN PANCASILA - FASE C (KELAS V & VI)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  {
    id: 'folder-pancasila-fase-c',
    mataPelajaran: 'Pendidikan Pancasila',
    fase: 'Fase C',
    kelas: 'V & VI (Lima & Enam)',
    deskripsiMapel: 'Folder resmi Pendidikan Pancasila Fase C (4 Elemen: Pancasila, UUD NRI 1945, Bhinneka Tunggal Ika, NKRI) - BSKAP 046/2025',
    elemenList: [
      {
        id: 'pancasila-fc-el-1',
        elemen: 'Pancasila',
        deskripsiSingkat: 'Kronologi kelahiran Pancasila, meneladani perumus, kesatuan sila, nilai dasar negara',
        capaianPembelajaran: `Memahami kronologi sejarah kelahiran Pancasila; meneladani sikap para perumus Pancasila dan menerapkan di lingkungan masyarakat; menghubungkan sila-sila dalam Pancasila sebagai suatu kesatuan yang utuh; menguraikan makna nilai-nilai Pancasila sebagai dasar negara, dan pandangan hidup bangsa.`
      },
      {
        id: 'pancasila-fc-el-2',
        elemen: 'Undang-Undang Dasar Negara Republik Indonesia Tahun 1945',
        deskripsiSingkat: 'Norma, hak dan kewajiban warga negara, Pembukaan UUD 1945, musyawarah mufakat',
        capaianPembelajaran: `Mengimplementasikan bentuk-bentuk norma, hak, dan kewajiban dalam kedudukannya sebagai warga negara; mengenal Pembukaan Undang-Undang Dasar Negara Republik Indonesia tahun 1945; mempraktikkan musyawarah untuk membuat kesepakatan dan aturan bersama, serta menerapkannya dalam lingkungan keluarga dan sekolah.`
      },
      {
        id: 'pancasila-fc-el-3',
        elemen: 'Bhinneka Tunggal Ika',
        deskripsiSingkat: 'Menyajikan identifikasi sikap menghormati, menjaga, dan melestarikan keberagaman budaya',
        capaianPembelajaran: `Menyajikan hasil identifikasi sikap menghormati, menjaga, dan melestarikan keberagaman budaya sesuai semboyan dalam bingkai Bhinneka Tunggal Ika di lingkungan sekitar.`
      },
      {
        id: 'pancasila-fc-el-4',
        elemen: 'Negara Kesatuan Republik Indonesia',
        deskripsiSingkat: 'Wilayah kabupaten/kota dan provinsi, gotong royong menjaga persatuan sebagai bela negara',
        capaianPembelajaran: `Mengenal wilayahnya dalam konteks kabupaten/kota, dan provinsi sebagai bagian dari wilayah Negara Kesatuan Republik Indonesia; menunjukkan perilaku gotong royong untuk menjaga persatuan di lingkungan sekolah dan sekitar sebagai wujud bela negara.`
      }
    ]
  },

  // =========================================================================
  // 10. PENDIDIKAN AGAMA KATOLIK DAN BUDI PEKERTI - FASE A (KELAS I & II)
  // Sesuai Regulasi Standar CP BKP No. 020/2026
  // =========================================================================
  {
    id: 'folder-katolik-fase-a',
    mataPelajaran: 'Pendidikan Agama Katolik dan Budi Pekerti',
    fase: 'Fase A',
    kelas: 'I & II (Satu & Dua)',
    deskripsiMapel: 'Folder resmi Pendidikan Agama Katolik dan Budi Pekerti Fase A (4 Elemen: Pribadi murid, Yesus Kristus, Gereja, Masyarakat) - Regulasi BKP 020/2026',
    elemenList: [
      {
        id: 'katolik-fa-el-1',
        elemen: 'Pribadi murid',
        deskripsiSingkat: 'Pribadi dicintai Tuhan, anggota tubuh yang berguna & perawatannya, teman, lingkungan rumah dan sekolah tempat mengembangkan potensi diri',
        capaianPembelajaran: `Murid memahami dirinya sebagai pribadi yang dicintai Tuhan, memiliki anggota tubuh yang berguna, memahami cara merawat tubuhnya; memahami teman-teman, lingkungan rumah dan sekolah sebagai tempat mengembangkan potensi diri.`
      },
      {
        id: 'katolik-fa-el-2',
        elemen: 'Yesus Kristus',
        deskripsiSingkat: 'Penciptaan langit bumi dan seluruh isinya, tokoh iman Perjanjian Lama (Nuh, Abraham, Ishak, Yakub), kisah kelahiran Yesus, tiga orang Majus, masa kanak-kanak Yesus di Nazaret, Yesus dipersembahkan di Bait Allah dan berada di Bait Allah umur 12 tahun',
        capaianPembelajaran: `Murid memahami bahwa Tuhan menciptakan langit, bumi, dan seluruh isinya; memahami tokoh-tokoh iman di dalam Perjanjian Lama (Nuh, Abraham, Ishak dan Yakub); memahami kisah kelahiran Tuhan Yesus, kisah tiga orang Majus, masa kanak-kanak Yesus di Nazaret, Yesus dipersembahkan di Bait Allah, dan berada di Bait Allah pada umur 12 tahun.`
      },
      {
        id: 'katolik-fa-el-3',
        elemen: 'Gereja',
        deskripsiSingkat: 'Tanda salib, doa pokok (Bapa Kami, Salam Maria, Kemuliaan), melaksanakan perintah Allah, membiasakan doa pujian, syukur, dan permohonan',
        capaianPembelajaran: `Murid memahami imannya dengan cara membuat tanda salib, berdoa Bapa Kami, Salam Maria, dan Kemuliaan; memahami iman dengan melaksanakan perintah Allah, dan membiasakan diri dengan berdoa pujian, syukur dan permohonan.`
      },
      {
        id: 'katolik-fa-el-4',
        elemen: 'Masyarakat',
        deskripsiSingkat: 'Lingkungan keluarga dan teman, kebiasaan bekerja sama, hidup rukun dengan tetangga, gotong royong merawat lingkungan',
        capaianPembelajaran: `Murid memahami lingkungan keluarga, dan teman-teman, memiliki kebiasaan bekerja sama dengan anggota keluarga dan teman-teman; memahami iman di tengah masyarakat melalui kebiasaan hidup rukun dengan tetangga dan bergotong royong merawat lingkungan.`
      }
    ]
  },

  // =========================================================================
  // 11. PENDIDIKAN AGAMA KRISTEN DAN BUDI PEKERTI - FASE A (KELAS I & II)
  // Sesuai Regulasi Standar CP BKP No. 020/2026
  // =========================================================================
  {
    id: 'folder-kristen-fase-a',
    mataPelajaran: 'Pendidikan Agama Kristen dan Budi Pekerti',
    fase: 'Fase A',
    kelas: 'I & II (Satu & Dua)',
    deskripsiMapel: 'Folder resmi Pendidikan Agama Kristen dan Budi Pekerti Fase A (4 Elemen: Allah Berkarya, Manusia dan Nilai-nilai Kristiani, Gereja dan Masyarakat Majemuk, Alam dan Lingkungan Hidup) - Regulasi BKP 020/2026',
    elemenList: [
      {
        id: 'kristen-fa-el-1',
        elemen: 'Allah Berkarya',
        deskripsiSingkat: 'Allah Pencipta: Pribadi istimewa & berinteraksi; Allah Pemelihara: Pemeliharaan Allah melalui kehadiran keluarga',
        capaianPembelajaran: `Subelemen Allah Pencipta: Murid memahami Allah menciptakan dirinya sebagai pribadi yang istimewa dan membangun interaksi dengan lingkungan terdekat.
Subelemen Allah Pemelihara: Murid memahami pemeliharaan Allah pada dirinya melalui kehadiran keluarga.`
      },
      {
        id: 'kristen-fa-el-2',
        elemen: 'Manusia dan Nilai-nilai Kristiani',
        deskripsiSingkat: 'Hakikat Manusia: Diri sebagai pribadi bertumbuh & berkembang; Nilai-nilai Kristiani: Makna kebaikan, ramah dan sopan di rumah dan di sekolah',
        capaianPembelajaran: `Subelemen Hakikat Manusia: Murid memahami diri sebagai pribadi yang bertumbuh dan berkembang.
Subelemen Nilai-nilai Kristiani: Murid memahami makna kebaikan, ramah dan sopan di rumah dan di sekolah.`
      },
      {
        id: 'kristen-fa-el-3',
        elemen: 'Gereja dan Masyarakat Majemuk',
        deskripsiSingkat: 'Tugas Panggilan Gereja: Wadah berkumpul & beribadah, berdoa & memuji Tuhan; Masyarakat Majemuk: Keragaman suku bangsa anugerah Allah',
        capaianPembelajaran: `Subelemen Tugas Panggilan Gereja: Murid memahami keberadaan gereja sebagai wadah berkumpul dan beribadah serta kewajiban berdoa dan memuji Tuhan.
Subelemen Masyarakat Majemuk: Murid memahami keragaman suku bangsa sebagai anugerah Allah.`
      },
      {
        id: 'kristen-fa-el-4',
        elemen: 'Alam dan Lingkungan Hidup',
        deskripsiSingkat: 'Alam Ciptaan Allah: Alam dan lingkungan hidup ciptaan Allah; Tanggung Jawab: Tugas memelihara alam & lingkungan di rumah dan di sekolah',
        capaianPembelajaran: `Subelemen Alam Ciptaan Allah: Murid memahami alam dan lingkungan hidup sebagai ciptaan Allah.
Subelemen Tanggung Jawab Manusia Terhadap Alam: Murid memahami tugas memelihara alam dan lingkungan hidup di rumah dan di sekolah.`
      }
    ]
  },

  // =========================================================================
  // 12. PENDIDIKAN AGAMA KATOLIK DAN BUDI PEKERTI - FASE B (KELAS III & IV)
  // Sesuai Regulasi Standar CP BKP No. 020/2026
  // =========================================================================
  {
    id: 'folder-katolik-fase-b',
    mataPelajaran: 'Pendidikan Agama Katolik dan Budi Pekerti',
    fase: 'Fase B',
    kelas: 'III & IV (Tiga & Empat)',
    deskripsiMapel: 'Folder resmi Pendidikan Agama Katolik dan Budi Pekerti Fase B (4 Elemen: Pribadi murid, Yesus Kristus, Gereja, Masyarakat) - Regulasi BKP 020/2026',
    elemenList: [
      {
        id: 'katolik-fb-el-1',
        elemen: 'Pribadi murid',
        deskripsiSingkat: 'Tumbuh kembang diri, perbuatan baik wujud iman, pribadi unik, bersyukur & mengembangkan keunikan bersama orang lain dan lingkungan sekitar',
        capaianPembelajaran: `Murid memahami dirinya sebagai pribadi yang tumbuh dan berkembang, mewujudkan iman dengan cara melakukan perbuatan baik; memahami diri sebagai pribadi yang unik, bersyukur dan bersedia mengembangkan keunikan diri bersama orang lain dan lingkungan sekitar.`
      },
      {
        id: 'katolik-fb-el-2',
        elemen: 'Yesus Kristus',
        deskripsiSingkat: 'Karya keselamatan Allah melalui Yusuf, Musa, Yosua; Sepuluh Perintah Allah; bangsa Israel memasuki tanah terjanji, pemimpin Israel (Samuel, Saul, Daud); Yesus pemenuhan janji Allah',
        capaianPembelajaran: `Murid memahami karya keselamatan Allah melalui tokoh-tokoh Yusuf, Musa, dan Yosua; memahami Sepuluh Perintah Allah sebagai pedoman hidup; memahami bangsa Israel memasuki tanah terjanji, Allah memberkati pemimpin Israel (Samuel, Saul, dan Daud); memahami Yesus sebagai pemenuhan janji Allah yang mewartakan Kerajaan Allah melalui perkataan, perbuatan dan mukjizat.`
      },
      {
        id: 'katolik-fb-el-3',
        elemen: 'Gereja',
        deskripsiSingkat: 'Sakramen Baptis, Sakramen Ekaristi, dan Sakramen Tobat; rasa syukur dalam doa pribadi dan doa bersama, mewujudkan doa dalam sikap dan tindakan',
        capaianPembelajaran: `Murid memahami Sakramen Baptis, Sakramen Ekaristi, dan Sakramen Tobat; mengungkapkan rasa syukur dalam doa pribadi dan doa bersama, mewujudkan makna doa melalui sikap dan tindakan dalam kehidupan sehari-hari.`
      },
      {
        id: 'katolik-fb-el-4',
        elemen: 'Masyarakat',
        deskripsiSingkat: 'Menghormati pemimpin masyarakat & tradisi, melestarikan lingkungan alam, menghormati orang tua, menghormati hidup pribadi & milik orang lain',
        capaianPembelajaran: `Murid mewujudkan imannya di tengah masyarakat melalui kebiasaan menghormati pemimpin masyarakat, menghargai tradisi masyarakat, melestarikan lingkungan alam; mewujudkan rasa hormat terhadap orang tua, menghormati hidup pribadi, menghormati milik orang lain.`
      }
    ]
  },

  // =========================================================================
  // 13. PENDIDIKAN AGAMA KRISTEN DAN BUDI PEKERTI - FASE B (KELAS III & IV)
  // Sesuai Regulasi Standar CP BKP No. 020/2026
  // =========================================================================
  {
    id: 'folder-kristen-fase-b',
    mataPelajaran: 'Pendidikan Agama Kristen dan Budi Pekerti',
    fase: 'Fase B',
    kelas: 'III & IV (Tiga & Empat)',
    deskripsiMapel: 'Folder resmi Pendidikan Agama Kristen dan Budi Pekerti Fase B (4 Elemen: Allah Berkarya, Manusia dan Nilai-nilai Kristiani, Gereja dan Masyarakat Majemuk, Alam dan Lingkungan Hidup) - Regulasi BKP 020/2026',
    elemenList: [
      {
        id: 'kristen-fb-el-1',
        elemen: 'Allah Berkarya',
        deskripsiSingkat: 'Allah Pencipta: Flora, fauna, manusia; Allah Pemelihara: Hadir lewat orang sekitar; Allah Penyelamat: Sebagai penyelamat; Allah Pembaru: Mengenal Allah pembaru',
        capaianPembelajaran: `Subelemen Allah Pencipta: Murid memahami Allah menciptakan flora dan fauna, serta manusia (perempuan dan laki-laki).
Subelemen Allah Pemelihara: Murid memahami pemeliharaan Allah pada dirinya dan melalui kehadiran orang-orang di sekitarnya.
Subelemen Allah Penyelamat: Murid memahami Allah sebagai penyelamat.
Subelemen Allah Pembaru: Murid mengenal Allah pembaru.`
      },
      {
        id: 'kristen-fb-el-2',
        elemen: 'Manusia dan Nilai-nilai Kristiani',
        deskripsiSingkat: 'Hakikat Manusia: Makhluk individu & sosial bergaul kerja sama; Nilai-nilai Kristiani: Sikap disiplin di rumah dan sekolah',
        capaianPembelajaran: `Subelemen Hakikat Manusia: Murid memahami diri sebagai makhluk individu dan sosial yang dapat bergaul dan bekerja sama dengan teman, saudara, dan orang tua.
Subelemen Nilai-nilai Kristiani: Murid memahami sikap disiplin di rumah dan di sekolah.`
      },
      {
        id: 'kristen-fb-el-3',
        elemen: 'Gereja dan Masyarakat Majemuk',
        deskripsiSingkat: 'Tugas Panggilan Gereja: Bersekutu, bersaksi, dan melayani; Masyarakat Majemuk: Keragaman budaya dan agama anugerah Allah',
        capaianPembelajaran: `Subelemen Tugas Panggilan Gereja: Murid memahami tugas panggilan gereja untuk bersekutu, bersaksi, dan melayani.
Subelemen Masyarakat Majemuk: Murid memahami keragaman budaya dan agama sebagai anugerah Allah.`
      },
      {
        id: 'kristen-fb-el-4',
        elemen: 'Alam dan Lingkungan Hidup',
        deskripsiSingkat: 'Alam Ciptaan Allah: Hadir dalam berbagai fenomena alam; Tanggung Jawab: Upaya memelihara alam dan lingkungan sekitarnya',
        capaianPembelajaran: `Subelemen Alam Ciptaan Allah: Murid memahami Allah hadir dalam berbagai fenomena alam.
Subelemen Tanggung Jawab Manusia Terhadap Alam: Murid memahami upaya memelihara alam dan lingkungan sekitarnya.`
      }
    ]
  },

  // =========================================================================
  // 11. PJOK - FASE B (KELAS III & IV)
  // =========================================================================
  {
    id: 'folder-pjok-fase-b',
    mataPelajaran: 'PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)',
    fase: 'Fase B',
    kelas: 'III & IV (Tiga & Empat)',
    deskripsiMapel: 'Folder lengkap PJOK Fase B (4 Elemen: Terampil Bergerak, Belajar Melalui Gerak, Bergaya Hidup Aktif, Memilih Hidup Sehat)',
    elemenList: [
      {
        id: 'pjok-fb-el-1',
        elemen: 'Terampil Bergerak (Keterampilan Gerak)',
        deskripsiSingkat: 'Kombinasi gerak lokomotor, non-lokomotor, dan manipulatif dalam bola besar (sepak bola/voli), bola kecil (kasti), dan atletik',
        capaianPembelajaran: `Peserta didik mempraktikkan variasi dan kombinasi pola gerak dasar lokomotor, non-lokomotor, dan manipulatif dalam berbagai permainan bola besar (sepak bola, bola voli), bola kecil (kasti, rounders), serta aktivitas atletik dasar (lari cepat, lompat jauh).`
      },
      {
        id: 'pjok-fb-el-2',
        elemen: 'Belajar Melalui Gerak (Pengetahuan Gerak)',
        deskripsiSingkat: 'Pola gerak dominan senam lantai (keseimbangan, berguling, bertumpu) dan gerak berirama (senam irama)',
        capaianPembelajaran: `Peserta didik memahami konsep gerak dominan dalam senam (bertumpu, bergantung, keseimbangan, berpindah, tolakan, putaran, ayunan, melayang, dan mendarat) serta mempraktikkan rangkaian gerak berirama sederhana dengan kompak.`
      },
      {
        id: 'pjok-fb-el-3',
        elemen: 'Bergaya Hidup Aktif (Pemanfaatan Gerak)',
        deskripsiSingkat: 'Aktivitas kebugaran jasmani, daya tahan jantung, kelenturan, dan keselamatan aktivitas air (renang dasar)',
        capaianPembelajaran: `Peserta didik berpartisipasi aktif dalam aktivitas fisik untuk memelihara kebugaran jasmani (daya tahan, kekuatan, kelentukan), serta mengenal prinsip keselamatan saat beraktivitas di lingkungan air (pengenalan air dan renang gaya dada).`
      },
      {
        id: 'pjok-fb-el-4',
        elemen: 'Memilih Hidup Sehat (Pola Hidup Sehat)',
        deskripsiSingkat: 'Gizi seimbang, menjaga kebersihan alat reproduksi, pencegahan cedera saat olahraga',
        capaianPembelajaran: `Peserta didik memahami pentingnya pola makan bergizi seimbang (isi piringku), istirahat cukup, menjaga kebersihan alat reproduksi saat bertumbuh kembang, serta langkah pertolongan pertama pada cedera ringan saat berolahraga.`
      }
    ]
  },

  // =========================================================================
  // 12. SENI RUPA - FASE B (KELAS III & IV)
  // =========================================================================
  {
    id: 'folder-seni-rupa-fase-b',
    mataPelajaran: 'Seni Rupa',
    fase: 'Fase B',
    kelas: 'III & IV (Tiga & Empat)',
    deskripsiMapel: 'Folder lengkap Seni Rupa Fase B (5 Elemen: Mengalami, Menciptakan, Merefleksikan, Berpikir & Bekerja Artistik, Berdampak)',
    elemenList: [
      {
        id: 'sr-fb-el-1',
        elemen: 'Mengalami (Experiencing)',
        deskripsiSingkat: 'Eksplorasi warna sekunder, tekstur visual, ritme pola, dan bentuk organik di lingkungan sekitar',
        capaianPembelajaran: `Peserta didik mampu mengamati, mengenali, dan membedakan unsur-unsur rupa berupa garis dinamis, bentuk geometris & organik, pencampuran warna sekunder, tekstur nyata dan semu, serta ritme pola di alam sekitar.`
      },
      {
        id: 'sr-fb-el-2',
        elemen: 'Menciptakan (Making/Creating)',
        deskripsiSingkat: 'Membuat ragam hias dekoratif daerah, menggambar pemandangan perspektif, dan karya kriya daur ulang',
        capaianPembelajaran: `Peserta didik mampu menuangkan ide dan imajinasi visual dalam karya 2D dan 3D seperti membuat motif ragam hias dekoratif Nusantara, menggambar pemandangan dengan kedalaman ruang sederhana, dan membuat kerajinan kriya dari bahan daur ulang.`
      },
      {
        id: 'sr-fb-el-3',
        elemen: 'Merefleksikan (Reflecting)',
        deskripsiSingkat: 'Menceritakan makna karya seni sendiri dan mengapresiasi karya teman dengan santun',
        capaianPembelajaran: `Peserta didik mampu menceritakan proses kreatif dan pesan yang terkandung dalam karya seninya sendiri, serta memberikan apresiasi dan tanggapan positif yang membangun terhadap karya teman sejawat.`
      },
      {
        id: 'sr-fb-el-4',
        elemen: 'Berpikir dan Bekerja Artistik',
        deskripsiSingkat: 'Menggunakan peralatan seni secara aman, teknik kolase, anyaman, dan melipat',
        capaianPembelajaran: `Peserta didik terbiasa merawat dan menggunakan alat dan bahan seni secara bertanggung jawab dan aman. Peserta didik mengeksplorasi beragam teknik rupa seperti kolase, montase, anyaman sederhana, dan melipat.`
      },
      {
        id: 'sr-fb-el-5',
        elemen: 'Berdampak (Impacting)',
        deskripsiSingkat: 'Menghasilkan karya seni yang memperindah lingkungan kelas dan sekolah',
        capaianPembelajaran: `Peserta didik mampu menghasilkan karya rupa yang memberikan dampak positif, seperti karya dekorasi dinding kelas, papan informasi bergambar, atau produk kriya fungsional yang bernilai estetis.`
      }
    ]
  },

  // =========================================================================
  // 13. BAHASA INGGRIS - FASE B (KELAS III & IV)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  {
    id: 'folder-binggris-fase-b',
    mataPelajaran: 'Bahasa Inggris',
    fase: 'Fase B',
    kelas: 'III & IV (Tiga & Empat)',
    deskripsiMapel: 'Folder resmi Bahasa Inggris Fase B (3 Elemen: Menyimak-Berbicara, Membaca-Memirsa, Menulis-Mempresentasikan) - BSKAP 046/2025',
    elemenList: [
      {
        id: 'eng-fb-el-1',
        elemen: 'Menyimak - Berbicara (Listening - Speaking)',
        deskripsiSingkat: 'Memahami dan merespon teks lisan atau teks multimodal sederhana tentang kehidupan sehari-hari (verbal/non-verbal)',
        capaianPembelajaran: `Memahami dan merespon teks lisan atau teks multimodal sederhana tentang kehidupan sehari-hari baik secara verbal atau non-verbal sesuai konteks.

(understand and respond to simple oral or multimodal texts about everyday life verbally or non-verbally in line with its context)`
      },
      {
        id: 'eng-fb-el-2',
        elemen: 'Membaca - Memirsa (Reading - Viewing)',
        deskripsiSingkat: 'Memahami teks tulis pendek sederhana atau teks multimodal tentang kehidupan sehari-hari (verbal/non-verbal)',
        capaianPembelajaran: `Memahami teks tulis pendek sederhana atau teks multimodal tentang kehidupan sehari-hari dan meresponsnya secara verbal atau non-verbal sesuai konteks.

(Understand simple short texts or multimodal texts about everyday life and respond to them verbally or non-verbally in line with its context)`
      },
      {
        id: 'eng-fb-el-3',
        elemen: 'Menulis - Mempresentasikan (Writing - Presenting)',
        deskripsiSingkat: 'Mengomunikasikan gagasan tentang topik sehari-hari dalam teks tulis pendek atau teks multimodal',
        capaianPembelajaran: `Mengomunikasikan gagasan tentang topik sehari-hari dalam teks tulis pendek atau teks multimodal sesuai konteks.

(Communicate their ideas on everyday life topics in simple written or multimodal texts in line with its context)`
      }
    ]
  },

  // =========================================================================
  // 15. PENDIDIKAN AGAMA KATOLIK DAN BUDI PEKERTI - FASE C (KELAS V & VI)
  // Sesuai Regulasi Standar CP BKP No. 020/2026
  // =========================================================================
  {
    id: 'folder-katolik-fase-c',
    mataPelajaran: 'Pendidikan Agama Katolik dan Budi Pekerti',
    fase: 'Fase C',
    kelas: 'V & VI (Lima & Enam)',
    deskripsiMapel: 'Folder resmi Pendidikan Agama Katolik dan Budi Pekerti Fase C (4 Elemen: Pribadi murid, Yesus Kristus, Gereja, Masyarakat) - Regulasi BKP 020/2026',
    elemenList: [
      {
        id: 'katolik-fc-el-1',
        elemen: 'Pribadi murid',
        deskripsiSingkat: 'Citra Allah perempuan & laki-laki yang sederajat & saling melengkapi, hak & kewajiban warga negara, bangga bangsa Indonesia, warga dunia',
        capaianPembelajaran: `Murid memahami diri sebagai perempuan atau laki-laki sebagai citra Allah yang sederajat dan saling melengkapi; memahami hak dan kewajiban dirinya sebagai warga negara dan bangga sebagai bangsa Indonesia; memahami diri sebagai warga dunia.`
      },
      {
        id: 'katolik-fc-el-2',
        elemen: 'Yesus Kristus',
        deskripsiSingkat: 'Daud pemimpin tangguh, Salomo bijaksana, Ester pemberani, Maria & Elisabet; Yesus taat, pengampunan, sengsara wafat bangkit, Roh Kudus; Nabi Elia, Amos, Yesaya; mewartakan kerajaan Allah',
        capaianPembelajaran: `Murid memahami perjuangan tokoh-tokoh Kitab Suci: Daud sebagai pemimpin yang tangguh; Salomo yang bijaksana, dan Ester perempuan pemberani, serta tokoh Maria dan Elisabet yang setia dan berserah kepada Allah; meneladani Yesus yang taat kepada Allah; mengajarkan pengampunan, memanggil orang berdosa; menderita, wafat, dan bangkit; mengutus Roh Kudus untuk menguatkan para rasul, dan orang yang beriman kepada-Nya; memahami perjuangan Nabi Elia yang menobatkan bangsa Israel; Nabi Amos sebagai pejuang keadilan; dan Nabi Yesaya yang menubuatkan kedatangan Juru Selamat; memahami Yesus mewartakan kerajaan Allah dengan perkataan dan perbuatan.`
      },
      {
        id: 'katolik-fc-el-3',
        elemen: 'Gereja',
        deskripsiSingkat: 'Iman sehari-hari, menggereja dijiwai Roh Kudus, Gereja yang satu kudus katolik apostolik, persekutuan para kudus, pengampunan dosa, kebangkitan badan, hidup kekal',
        capaianPembelajaran: `Murid mewujudkan iman dalam kehidupan sehari-hari, melibatkan diri dalam kehidupan menggereja, sebagai wujud kehidupan bersama yang dijiwai oleh Roh Kudus; memahami gereja yang satu, kudus, katolik, dan apostolik; persekutuan para kudus; pengampunan dosa, kebangkitan badan dan kehidupan kekal.`
      },
      {
        id: 'katolik-fc-el-4',
        elemen: 'Masyarakat',
        deskripsiSingkat: 'Pelestarian lingkungan, bersikap jujur, bertindak menurut hati nurani, menegakkan keadilan hidup sehari-hari orang beriman Kristiani, dialog antarumat beragama',
        capaianPembelajaran: `Murid memahami pentingnya terlibat aktif dalam pelestarian lingkungan, bersikap jujur, bertindak menurut hati nurani, menegakkan keadilan dalam hidup sehari-hari sebagai orang beriman Kristiani, melakukan dialog antarumat beragama.`
      }
    ]
  },

  // =========================================================================
  // 16. PENDIDIKAN AGAMA KRISTEN DAN BUDI PEKERTI - FASE C (KELAS V & VI)
  // Sesuai Regulasi Standar CP BKP No. 020/2026
  // =========================================================================
  {
    id: 'folder-kristen-fase-c',
    mataPelajaran: 'Pendidikan Agama Kristen dan Budi Pekerti',
    fase: 'Fase C',
    kelas: 'V & VI (Lima & Enam)',
    deskripsiMapel: 'Folder resmi Pendidikan Agama Kristen dan Budi Pekerti Fase C (4 Elemen: Allah Berkarya, Manusia dan Nilai-nilai Kristiani, Gereja dan Masyarakat Majemuk, Alam dan Lingkungan Hidup) - Regulasi BKP 020/2026',
    elemenList: [
      {
        id: 'kristen-fc-el-1',
        elemen: 'Allah Berkarya',
        deskripsiSingkat: 'Allah Pencipta: Berkarya via keluarga, sekolah, masyarakat; Allah Pemelihara: Seluruh umat termasuk berkebutuhan khusus; Allah Penyelamat: Menyelamatkan via Yesus Kristus; Allah Pembaru: Membarui hidup manusia',
        capaianPembelajaran: `Subelemen Allah Pencipta: Murid memahami Allah pencipta berkarya melalui keluarga, sekolah dan masyarakat.
Subelemen Allah Pemelihara: Murid memahami Allah memelihara seluruh umat manusia termasuk mereka yang berkebutuhan khusus.
Subelemen Allah Penyelamat: Murid memahami Allah menyelamatkan manusia melalui Yesus Kristus.
Subelemen Allah Pembaru: Murid memahami Allah membarui hidup manusia.`
      },
      {
        id: 'kristen-fc-el-2',
        elemen: 'Manusia dan Nilai-nilai Kristiani',
        deskripsiSingkat: 'Hakikat Manusia: Manusia adalah makhluk terbatas; Nilai-nilai Kristiani: Buah Roh dalam interaksi antar sesama',
        capaianPembelajaran: `Subelemen Hakikat Manusia: Murid memahami bahwa manusia adalah makhluk terbatas.
Subelemen Nilai-nilai Kristiani: Murid memahami buah Roh dalam interaksi antar sesama.`
      },
      {
        id: 'kristen-fc-el-3',
        elemen: 'Gereja dan Masyarakat Majemuk',
        deskripsiSingkat: 'Tugas Panggilan Gereja: Pelayanan sesama tanggung jawab orang beriman; Masyarakat Majemuk: Hidup rukun & toleransi masyarakat majemuk',
        capaianPembelajaran: `Subelemen Tugas Panggilan Gereja: Murid memahami pelayanan terhadap sesama sebagai tanggung jawab orang beriman dalam kehidupan.
Subelemen Masyarakat Majemuk: Murid memahami hidup rukun dan toleransi dalam masyarakat majemuk.`
      },
      {
        id: 'kristen-fc-el-4',
        elemen: 'Alam dan Lingkungan Hidup',
        deskripsiSingkat: 'Alam Ciptaan Allah: Hadir melalui alam ciptaan; Tanggung Jawab: Tanggung jawab orang beriman memelihara lingkungan hidup',
        capaianPembelajaran: `Subelemen Alam Ciptaan Allah: Murid memahami Allah hadir melalui alam ciptaan.
Subelemen Tanggung Jawab Manusia Terhadap Alam: Murid memahami tanggung jawab orang beriman dalam memelihara lingkungan hidup.`
      }
    ]
  },

  // =========================================================================
  // 15. PJOK - FASE C (KELAS V & VI)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  {
    id: 'folder-pjok-fase-c',
    mataPelajaran: 'PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)',
    fase: 'Fase C',
    kelas: 'V & VI (Lima & Enam)',
    deskripsiMapel: 'Folder lengkap PJOK Fase C (4 Elemen: Terampil Bergerak, Belajar Melalui Gerak, Bergaya Hidup Aktif, Memilih Hidup Sehat) - BSKAP 046/2025',
    elemenList: [
      {
        id: 'pjok-fc-el-1',
        elemen: 'Terampil Bergerak (Keterampilan Gerak)',
        deskripsiSingkat: 'Variasi dan kombinasi gerak dasar lokomotor, nonlokomotor, manipulatif pada permainan bola besar/kecil, atletik, dan beladiri',
        capaianPembelajaran: `Peserta didik dapat menunjukkan kemampuan dalam mempraktikkan variasi dan kombinasi gerak dasar lokomotor, nonlokomotor, dan manipulatif dalam berbagai permainan invasi, net, lapangan (bola voli, sepak bola, kasti), aktivitas atletik (lari, lompat, lempar), serta bela diri tradisional secara terampil.`
      },
      {
        id: 'pjok-fc-el-2',
        elemen: 'Belajar Melalui Gerak (Aplikasi Konsep Gerak)',
        deskripsiSingkat: 'Penerapan konsep gerak, strategi kerjasama kelompok, sportivitas, dan fair play',
        capaianPembelajaran: `Peserta didik mampu menerapkan konsep dan prinsip variasi gerak serta strategi taktis dalam situasi permainan sederhana, menjunjung tinggi kejujuran (fair play), kerja sama, menghargai perbedaan kemampuan teman, dan menerima kekalahan maupun kemenangan dengan lapang dada.`
      },
      {
        id: 'pjok-fc-el-3',
        elemen: 'Bergaya Hidup Aktif (Pemanfaatan Gerak)',
        deskripsiSingkat: 'Pengukuran kebugaran jasmani, daya tahan aerobik, kekuatan otot, dan aktivitas penyelamatan di air',
        capaianPembelajaran: `Peserta didik berpartisipasi aktif dalam latihan kebugaran jasmani terukur (daya tahan jantung-paru, kekuatan, kelenturan), mampu memantau denyut nadi latihan secara sederhana, serta menguasai dasar keselamatan dan teknik renang gaya dada/bebas di air.`
      },
      {
        id: 'pjok-fc-el-4',
        elemen: 'Memilih Hidup Sehat (Pola Hidup Sehat)',
        deskripsiSingkat: 'Pemahaman masa pubertas, kesehatan reproduksi, bahaya rokok/narkoba, dan pertolongan pertama (P3K)',
        capaianPembelajaran: `Peserta didik memahami perubahan fisik dan psikis pada masa pubertas, cara menjaga kebersihan dan kesehatan organ reproduksi, dampak negatif rokok, alkohol, dan zat adiktif, serta tindakan pencegahan penyakit menular dan pertolongan pertama pada kecelakaan.`
      }
    ]
  },

  // =========================================================================
  // 16. SENI RUPA - FASE C (KELAS V & VI)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  {
    id: 'folder-seni-rupa-fase-c',
    mataPelajaran: 'Seni Rupa',
    fase: 'Fase C',
    kelas: 'V & VI (Lima & Enam)',
    deskripsiMapel: 'Folder resmi Seni Rupa Fase C (5 Elemen: Mengalami, Menciptakan, Merefleksikan, Berpikir & Bekerja Artistik, Berdampak) - BSKAP 046/2025',
    elemenList: [
      {
        id: 'sr-fc-el-1',
        elemen: 'Mengalami (Experiencing)',
        deskripsiSingkat: 'Prinsip desain keseimbangan, proporsi, ritme, dan kedalaman ruang perspektif 1 titik hilang',
        capaianPembelajaran: `Peserta didik mampu mengamati, menganalisis, dan mengeksplorasi prinsip-prinsip seni rupa (keseimbangan, proporsi, penekanan, ritme, dan kesatuan) serta konsep kedalaman perspektif satu titik hilang pada objek alam dan buatan di sekitarnya.`
      },
      {
        id: 'sr-fc-el-2',
        elemen: 'Menciptakan (Making/Creating)',
        deskripsiSingkat: 'Karya gambar perspektif, kriya anyam/jahit/ikatan, ragam hias ornamen Nusantara, dan poster edukatif',
        capaianPembelajaran: `Peserta didik mampu menuangkan ide kreatif orisinal dalam karya rupa 2D dan 3D seperti gambar perspektif pemandangan perkotaan/pedesaan, kriya fungsional tekstil/anyaman tradisional, ragam hias ornamen Nusantara, dan poster visual kampanye sosial.`
      },
      {
        id: 'sr-fc-el-3',
        elemen: 'Merefleksikan (Reflecting)',
        deskripsiSingkat: 'Apresiasi kritis karya seni daerah dan presentasi portofolio karya pribadi',
        capaianPembelajaran: `Peserta didik mampu mengevaluasi dan mengapresiasi keindahan karya seni tradisional dan kontemporer, memberikan kritik seni yang santun dan berbobot, serta mempresentasikan portofolio karya seni pribadinya secara percaya diri.`
      },
      {
        id: 'sr-fc-el-4',
        elemen: 'Berpikir dan Bekerja Artistik',
        deskripsiSingkat: 'Eksplorasi media campuran (mixed media), daur ulang kreatif, dan keselamatan kerja seni',
        capaianPembelajaran: `Peserta didik terbiasa bereksperimen dengan berbagai kombinasi alat, bahan, dan teknik campuran (mixed media), mengutamakan prosedur keselamatan dan kebersihan, serta memodifikasi limbah lingkungan menjadi bahan karya artistik.`
      },
      {
        id: 'sr-fc-el-5',
        elemen: 'Berdampak (Impacting)',
        deskripsiSingkat: 'Pameran seni mini di kelas/sekolah dan kreasi produk seni fungsional bermakna',
        capaianPembelajaran: `Peserta didik mampu mengorganisasi pameran seni rupa mini di lingkungan sekolah, serta menciptakan produk karya seni fungsional yang memberi manfaat nyata bagi estetika kelas atau kegiatan warga sekolah.`
      }
    ]
  },

  // =========================================================================
  // 17. BAHASA INGGRIS - FASE C (KELAS V & VI)
  // Sesuai Keputusan Kepala BSKAP No. 046 Tahun 2025
  // =========================================================================
  {
    id: 'folder-binggris-fase-c',
    mataPelajaran: 'Bahasa Inggris',
    fase: 'Fase C',
    kelas: 'V & VI (Lima & Enam)',
    deskripsiMapel: 'Folder resmi Bahasa Inggris Fase C (3 Elemen: Menyimak-Berbicara, Membaca-Memirsa, Menulis-Mempresentasikan) - BSKAP 046/2025',
    elemenList: [
      {
        id: 'eng-fc-el-1',
        elemen: 'Menyimak - Berbicara (Listening - Speaking)',
        deskripsiSingkat: 'Memahami alur informasi teks keseluruhan dan merespon teks lisan/multimodal sederhana topik sehari-hari secara lisan',
        capaianPembelajaran: `Memahami alur informasi teks secara keseluruhan dan merespon teks lisan atau teks multimodal sederhana tentang topik sehari-hari secara lisan dengan kalimat pendek dan sederhana sesuai konteks.

(Understand the entire flow of information and respond to simple oral or multimodal texts about everyday topics using short and simple sentences verbally in line with its context)`
      },
      {
        id: 'eng-fc-el-2',
        elemen: 'Membaca - Memirsa (Reading - Viewing)',
        deskripsiSingkat: 'Memahami alur informasi keseluruhan, gagasan utama dan informasi rinci dari beragam teks pendek/multimodal topik sehari-hari',
        capaianPembelajaran: `Memahami alur informasi secara keseluruhan, gagasan utama dan informasi rinci dari beragam teks pendek atau teks multimodal tentang topik sehari-hari dan meresponnya sesuai konteks.

(Understand the entire flow of information, main ideas and details from a variety of short texts or multimodal texts about everyday topics and respond in line with its context)`
      },
      {
        id: 'eng-fc-el-3',
        elemen: 'Menulis - Mempresentasikan (Writing - Presenting)',
        deskripsiSingkat: 'Mengomunikasikan ide dan pengalamannya melalui berbagai jenis teks tulis sederhana atau teks multimodal topik sehari-hari',
        capaianPembelajaran: `Mengomunikasikan ide dan pengalamannya melalui berbagai jenis teks tulis sederhana atau teks multimodal tentang topik sehari-hari sesuai konteks.

(Communicate their ideas and experiences through various types of simple written texts or multimodal texts about everyday topics in line with its context)`
      }
    ]
  }
];

// Flat export for existing references if any
export const OFFICIAL_BSKAP_CP_DATABASE: SubjectCPItem[] = OFFICIAL_SUBJECT_FOLDERS.flatMap((folder) =>
  folder.elemenList.map((el) => ({
    id: el.id,
    mataPelajaran: folder.mataPelajaran,
    fase: folder.fase,
    kelas: folder.kelas,
    elemen: el.elemen,
    deskripsiSingkat: el.deskripsiSingkat || el.elemen,
    capaianPembelajaran: el.capaianPembelajaran,
  }))
);
