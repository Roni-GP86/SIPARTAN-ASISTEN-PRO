export interface LKPDStyleTheme {
  meetingNum: number;
  frameName: string;
  borderColor: string;
  badgeBg: string;
  accentBg: string;
  accentBorder: string;
  textColor: string;
  icon: string;
  titleColor: string;
  hexColor: string;
  borderStyleCss: string;
  cardContainerClass: string;
  exportBorderStyle: string;
  headerBannerClass: string;
}

export function getLKPDMeetingStyle(meetingNum: number, mataPelajaran: string = ''): LKPDStyleTheme {
  // Palet warna cerah dan bersih untuk berbagai mata pelajaran
  const colors: { [key: string]: { hex: string, border: string, bg: string, text: string } } = {
    matematika: { hex: '#2563eb', border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-900' },
    bahasa: { hex: '#7c3aed', border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-900' },
    ipa: { hex: '#059669', border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-900' },
    ips: { hex: '#d97706', border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-900' },
    default: { hex: '#475569', border: 'border-slate-500', bg: 'bg-slate-50', text: 'text-slate-900' }
  };

  const mapelKey = Object.keys(colors).find(k => mataPelajaran.toLowerCase().includes(k)) || 'default';
  const color = colors[mapelKey];

  const themes: Omit<LKPDStyleTheme, 'meetingNum'>[] = [
    {
      frameName: 'Bingkai Modern Minimalis',
      borderColor: color.border,
      badgeBg: `${color.bg} ${color.text} border ${color.border}`,
      accentBg: color.bg,
      accentBorder: color.border,
      textColor: 'text-slate-800',
      icon: '✨',
      titleColor: color.text,
      hexColor: color.hex,
      borderStyleCss: `border: 2px solid ${color.hex}; border-radius: 12px; padding: 20px; background-color: #ffffff;`,
      cardContainerClass: `border-2 ${color.border} rounded-2xl bg-white p-6 space-y-5 font-serif text-[12pt] text-slate-900 shadow-sm`,
      exportBorderStyle: `border: 2pt solid ${color.hex}; border-radius: 12px; padding: 20px; background-color: #ffffff; font-family: "Times New Roman", Times, serif; font-size: 12pt;`,
      headerBannerClass: `border-b-2 ${color.border} pb-3 mb-4 flex items-center justify-between`,
    },
    {
      frameName: 'Bingkai Elegan Bergaris',
      borderColor: color.border,
      badgeBg: `${color.hex} text-white`,
      accentBg: 'bg-white',
      accentBorder: color.border,
      textColor: 'text-slate-900',
      icon: '🎨',
      titleColor: color.text,
      hexColor: color.hex,
      borderStyleCss: `border-top: 5px solid ${color.hex}; border-bottom: 5px solid ${color.hex}; padding: 20px; background-color: #ffffff;`,
      cardContainerClass: `border-y-4 ${color.border} bg-white p-6 space-y-5 font-serif text-[12pt] text-slate-900`,
      exportBorderStyle: `border-top: 5pt solid ${color.hex}; border-bottom: 5pt solid ${color.hex}; padding: 20px; background-color: #ffffff; font-family: "Times New Roman", Times, serif; font-size: 12pt;`,
      headerBannerClass: `border-b ${color.border} pb-3 mb-4 flex items-center justify-between`,
    },
    {
      frameName: 'Bingkai Formal Berwarna',
      borderColor: color.border,
      badgeBg: `bg-white ${color.text} border-2 ${color.border}`,
      accentBg: color.bg,
      accentBorder: color.border,
      textColor: 'text-slate-900',
      icon: '📚',
      titleColor: color.text,
      hexColor: color.hex,
      borderStyleCss: `border: 1px solid ${color.hex}; border-left: 10px solid ${color.hex}; padding: 20px; background-color: #ffffff;`,
      cardContainerClass: `border border-slate-300 border-l-8 ${color.border} bg-white p-6 space-y-5 font-serif text-[12pt] text-slate-900`,
      exportBorderStyle: `border: 1pt solid ${color.hex}; border-left: 10pt solid ${color.hex}; padding: 20px; background-color: #ffffff; font-family: "Times New Roman", Times, serif; font-size: 12pt;`,
      headerBannerClass: `border-b ${color.border} pb-3 mb-4 flex items-center justify-between`,
    }
  ];

  const idx = Math.max(0, meetingNum - 1) % themes.length;
  return {
    ...themes[idx],
    meetingNum,
  };
}
