export interface VillageMosque {
  id: string;
  name: string;
  sectOrType: string;
  imamName: string;
  location: string;
  mapUrl: string;
  image: string;
  hasQuranAcademy?: boolean;
}

export interface VillageSchool {
  id: string;
  name: string;
  level: 'primary' | 'middle' | 'high' | 'college' | 'academy';
  headName: string;
  location: string;
  mapUrl: string;
  image: string;
  studentsCountEstimate?: string;
}

export const initialMosques: VillageMosque[] = [
  {
    id: 'mosque-1',
    name: 'مرکزی جامع مسجد رتہ کلاں',
    sectOrType: 'اہلسنت والجماعت',
    imamName: 'قاری حافظ محمد یوسف',
    location: 'مرکزی چوک مین بازار، رتہ کلاں، جھنگ',
    mapUrl: 'https://maps.google.com/?q=Jamia+Masjid+Ratta+Kallan+Jhang',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    hasQuranAcademy: true,
  },
  {
    id: 'mosque-2',
    name: 'مدینہ مسجد و مدرسہ انوار مدینہ',
    sectOrType: 'جامع مسجد',
    imamName: 'مولانا عبدالشکور',
    location: 'محلہ دارالسلام، شرقی رتہ کلاں',
    mapUrl: 'https://maps.google.com/?q=Madina+Masjid+Ratta+Kallan+Jhang',
    image: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=600&q=80',
    hasQuranAcademy: true,
  },
  {
    id: 'mosque-3',
    name: 'مسجد بلال حبشیؓ',
    sectOrType: 'مسجد',
    imamName: 'حافظ قاری نذیر احمد',
    location: 'ڈیرہ ارشد، نہر کنارہ روڈ، رتہ کلاں',
    mapUrl: 'https://maps.google.com/?q=Masjid+Bilal+Ratta+Kallan+Jhang',
    image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=600&q=80',
    hasQuranAcademy: false,
  },
  {
    id: 'mosque-4',
    name: 'مسجد عائشہ صدیقہؓ و حفظ قرآن سینٹر',
    sectOrType: 'جامع مسجد',
    imamName: 'قاری ساجد محمود',
    location: 'محلہ غازی آباد، رتہ کلاں',
    mapUrl: 'https://maps.google.com/?q=Masjid+Ayesha+Ratta+Kallan+Jhang',
    image: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=600&q=80',
    hasQuranAcademy: true,
  }
];

export const initialSchools: VillageSchool[] = [
  {
    id: 'school-1',
    name: 'گورنمنٹ ہائی اسکول رتہ کلاں',
    level: 'high',
    headName: 'ہیڈ ماسٹر سر ندیم اختر',
    location: 'مین اڈا تا اسکول روڈ، رتہ کلاں جھنگ',
    mapUrl: 'https://maps.google.com/?q=Govt+High+School+Ratta+Kallan+Jhang',
    image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=600&q=80',
    studentsCountEstimate: '600+ طلباء',
  },
  {
    id: 'school-2',
    name: 'گورنمنٹ گرلز پرائمری اسکول رتہ کلاں',
    level: 'primary',
    headName: 'ہیڈ مسٹریس میڈم طاہرہ',
    location: 'نزد پرانی عیدگاہ، رتہ کلاں',
    mapUrl: 'https://maps.google.com/?q=Govt+Girls+Primary+School+Ratta+Kallan+Jhang',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80',
    studentsCountEstimate: '350+ طالبات',
  },
  {
    id: 'school-3',
    name: 'رتہ پبلک ماڈل اسکول و کوچنگ اکیڈمی',
    level: 'academy',
    headName: 'ڈائریکٹر محمد عاطف رفیق',
    location: 'مین بازار، نزد ڈاکخانہ، رتہ کلاں',
    mapUrl: 'https://maps.google.com/?q=Ratta+Model+School+Jhang',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    studentsCountEstimate: '400+ طلباء و طالبات',
  },
  {
    id: 'school-4',
    name: 'گورنمنٹ ایسوسی ایٹ ڈگری کالج (جھنگ لنک)',
    level: 'college',
    headName: 'پرنسپل پروفیسر مظہر حسین',
    location: 'رتہ کلاں تا جھنگ کچہری بائی پاس',
    mapUrl: 'https://maps.google.com/?q=Govt+College+Jhang',
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80',
    studentsCountEstimate: '1200+ طلباء',
  }
];
