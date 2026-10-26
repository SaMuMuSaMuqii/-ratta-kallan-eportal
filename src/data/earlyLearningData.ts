export interface EarlyLearningItem {
  id: string;
  char: string;
  word: string;
  englishWord: string;
  icon: string;
  category: 'urdu' | 'counting' | 'english';
  spokenText: string;
  bgColor: string;
}

export const URDU_ALPHABETS: EarlyLearningItem[] = [
  { id: 'alif', char: 'ا', word: 'انار', englishWord: 'Pomegranate', icon: '🍎', category: 'urdu', spokenText: 'الف سے انار! میٹھا اور لال انار۔ شاباش بیٹا!', bgColor: 'bg-red-50 border-red-200 text-red-900' },
  { id: 'bay', char: 'ب', word: 'بلی', englishWord: 'Cat', icon: '🐱', category: 'urdu', spokenText: 'بے سے بلی! پیاری سی بلی۔ میانو میانو! شاباش بیٹا!', bgColor: 'bg-amber-50 border-amber-200 text-amber-900' },
  { id: 'pay', char: 'پ', word: 'پتنگ', englishWord: 'Kite', icon: '🪁', category: 'urdu', spokenText: 'پے سے پتنگ! ہوا میں اڑتی پتنگ۔ بہت خوب بیٹا!', bgColor: 'bg-sky-50 border-sky-200 text-sky-900' },
  { id: 'tay', char: 'ت', word: 'تیتلی', englishWord: 'Butterfly', icon: '🦋', category: 'urdu', spokenText: 'تے سے تیتلی! رنگ برنگی خوبصورت تیتلی۔ شاباش!', bgColor: 'bg-pink-50 border-pink-200 text-pink-900' },
  { id: 'ttay', char: 'ٹ', word: 'ٹماٹر', englishWord: 'Tomato', icon: '🍅', category: 'urdu', spokenText: 'ٹے سے ٹماٹر! تازہ اور صحت بخش لال ٹماٹر۔', bgColor: 'bg-rose-50 border-rose-200 text-rose-900' },
  { id: 'say', char: 'ث', word: 'ثمر', englishWord: 'Fruits', icon: '🍇', category: 'urdu', spokenText: 'ثے سے ثمر! ثمر کا مطلب ہے پھل۔ پھل کھائیں اور صحت بنائیں!', bgColor: 'bg-purple-50 border-purple-200 text-purple-900' },
  { id: 'jeem', char: 'ج', word: 'جہاز', englishWord: 'Airplane', icon: '✈️', category: 'urdu', spokenText: 'جیم سے جہاز! آسمان میں اڑتا بڑا جہاز۔ شاباش بیٹا!', bgColor: 'bg-blue-50 border-blue-200 text-blue-900' },
  { id: 'chay', char: 'چ', word: 'چڑیا', englishWord: 'Sparrow', icon: '🐦', category: 'urdu', spokenText: 'چے سے چڑیا! چوں چوں کرتی ننھی چڑیا۔ بہت اچھے!', bgColor: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
  { id: 'hay', char: 'ح', word: 'حلوہ', englishWord: 'Halwa', icon: '🍯', category: 'urdu', spokenText: 'حے سے حلوہ! میٹھا اور مزیدار حلوہ۔', bgColor: 'bg-yellow-50 border-yellow-200 text-yellow-900' },
  { id: 'khay', char: 'خ', word: 'خربوزہ', englishWord: 'Melon', icon: '🍈', category: 'urdu', spokenText: 'خے سے خربوزہ! رتہ کلاں کے کھیتوں کا میٹھا خربوزہ۔', bgColor: 'bg-lime-50 border-lime-200 text-lime-900' },
  { id: 'dal', char: 'د', word: 'درخت', englishWord: 'Tree', icon: '🌳', category: 'urdu', spokenText: 'دال سے درخت! سایہ دار اور ٹھنڈا سبز درخت۔ شاباش بیٹا!', bgColor: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
  { id: 'ddal', char: 'ڈ', word: 'ڈول', englishWord: 'Bucket', icon: '🪣', category: 'urdu', spokenText: 'ڈال سے ڈول! کنویں اور نلکے سے پانی بھرنے والا ڈول۔', bgColor: 'bg-cyan-50 border-cyan-200 text-cyan-900' },
  { id: 'ray', char: 'ر', word: 'ریل گاڑی', englishWord: 'Train', icon: '🚂', category: 'urdu', spokenText: 'رے سے ریل گاڑی! چھک چھک چلتی ریل گاڑی۔ چھک چھک چھک چھک!', bgColor: 'bg-indigo-50 border-indigo-200 text-indigo-900' },
  { id: 'seen', char: 'س', word: 'سیب', englishWord: 'Apple', icon: '🍏', category: 'urdu', spokenText: 'سین سے سیب! روزانہ ایک سیب کھائیں اور تندرست رہیں۔ شاباش بیٹا!', bgColor: 'bg-green-50 border-green-200 text-green-900' },
  { id: 'sheen', char: 'ش', word: 'شیر', englishWord: 'Lion', icon: '🦁', category: 'urdu', spokenText: 'شین سے شیر! جنگل کا طاقتور بادشاہ شیر۔', bgColor: 'bg-amber-50 border-amber-200 text-amber-900' },
  { id: 'toay', char: 'ط', word: 'طوطا', englishWord: 'Parrot', icon: '🦜', category: 'urdu', spokenText: 'طوئے سے طوطا! میاں مٹھو سبز طوطا!', bgColor: 'bg-teal-50 border-teal-200 text-teal-900' },
  { id: 'gaaf', char: 'گ', word: 'گائے', englishWord: 'Cow', icon: '🐄', category: 'urdu', spokenText: 'گاف سے گائے! دیہات کی پیاری گائے جو ہمیں میٹھا دودھ دیتی ہے۔', bgColor: 'bg-stone-50 border-stone-200 text-stone-900' },
  { id: 'meem', char: 'م', word: 'مور', englishWord: 'Peacock', icon: '🦚', category: 'urdu', spokenText: 'میم سے مور! خوبصورت پروں والا مور۔ بہت خوب!', bgColor: 'bg-violet-50 border-violet-200 text-violet-900' },
];

export const COUNTING_TOYS: EarlyLearningItem[] = [
  { id: 'c1', char: '1', word: 'ایک ٹیڈی بیئر', englishWord: 'One Teddy Bear', icon: '🧸', category: 'counting', spokenText: 'ایک! ون! ایک پیارا کھلونا ٹیڈی بیئر۔ شاباش بیٹا!', bgColor: 'bg-amber-50 border-amber-200 text-amber-900' },
  { id: 'c2', char: '2', word: 'دو گاڑیاں', englishWord: 'Two Cars', icon: '🚗', category: 'counting', spokenText: 'دو! ٹو! دو چھوٹی تیز کھلونا گاڑیاں۔ پوپ پوپ!', bgColor: 'bg-red-50 border-red-200 text-red-900' },
  { id: 'c3', char: '3', word: 'تین سیب', englishWord: 'Three Apples', icon: '🍎', category: 'counting', spokenText: 'تین! تھری! ایک، دو، تین میٹھے لال سیب۔ شاباش!', bgColor: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
  { id: 'c4', char: '4', word: 'چار فٹ بال', englishWord: 'Four Balls', icon: '⚽', category: 'counting', spokenText: 'چار! فور! چار کھیلنے والی فٹ بال۔ گول!', bgColor: 'bg-blue-50 border-blue-200 text-blue-900' },
  { id: 'c5', char: '5', word: 'پانچ چمکتے ستارے', englishWord: 'Five Stars', icon: '⭐', category: 'counting', spokenText: 'پانچ! فائیو! آسمان کے پانچ خوبصورت چمکتے ستارے۔ بہت خوب بیٹا!', bgColor: 'bg-yellow-50 border-yellow-200 text-yellow-900' },
  { id: 'c6', char: '6', word: 'چھ رنگ برنگے غبارے', englishWord: 'Six Balloons', icon: '🎈', category: 'counting', spokenText: 'چھ! سکس! چھ اڑتے ہوئے رنگ برنگے غبارے۔', bgColor: 'bg-pink-50 border-pink-200 text-pink-900' },
  { id: 'c7', char: '7', word: 'سات خوبصورت پھول', englishWord: 'Seven Flowers', icon: '🌸', category: 'counting', spokenText: 'سات! سیون! باغ کے سات خوشبودار پھول۔ شاباش!', bgColor: 'bg-rose-50 border-rose-200 text-rose-900' },
  { id: 'c8', char: '8', word: 'آٹھ ننھی بطخیں', englishWord: 'Eight Ducks', icon: '🦆', category: 'counting', spokenText: 'آٹھ! ایٹ! تالاب میں تیرتی آٹھ بطخیں۔ کوئیک کوئیک!', bgColor: 'bg-teal-50 border-teal-200 text-teal-900' },
  { id: 'c9', char: '9', word: 'نو رنگین پنسلیں', englishWord: 'Nine Pencils', icon: '✏️', category: 'counting', spokenText: 'نو! نائن! سبق اور ڈرائنگ بنانے والی نو پنسلیں۔', bgColor: 'bg-purple-50 border-purple-200 text-purple-900' },
  { id: 'c10', char: '10', word: 'دس انعامی تحفے', englishWord: 'Ten Gifts', icon: '🎁', category: 'counting', spokenText: 'دس! ٹین! اچھے اور محنتی بچوں کے لیے دس شاندار انعامات۔ شاباش میرے پیارے بچے!', bgColor: 'bg-indigo-50 border-indigo-200 text-indigo-900' },
];

export const ENGLISH_ABC: EarlyLearningItem[] = [
  { id: 'ea', char: 'A', word: 'Apple', englishWord: 'Apple (سیب)', icon: '🍎', category: 'english', spokenText: 'A for Apple! اے فور ایپل۔ ایپل یعنی سیب۔ ویری گڈ بیٹا!', bgColor: 'bg-red-50 border-red-200 text-red-900' },
  { id: 'eb', char: 'B', word: 'Ball', englishWord: 'Ball (گیند)', icon: '⚽', category: 'english', spokenText: 'B for Ball! بی فور بال۔ بال یعنی کھیلنے والی گیند۔', bgColor: 'bg-blue-50 border-blue-200 text-blue-900' },
  { id: 'ec', char: 'C', word: 'Cat', englishWord: 'Cat (بلی)', icon: '🐱', category: 'english', spokenText: 'C for Cat! سی فور کیٹ۔ کیٹ یعنی پیاری بلی۔ میانو!', bgColor: 'bg-amber-50 border-amber-200 text-amber-900' },
  { id: 'ed', char: 'D', word: 'Duck', englishWord: 'Duck (بطخ)', icon: '🦆', category: 'english', spokenText: 'D for Duck! ڈی فور ڈک۔ ڈک یعنی بطخ۔ شاباش بیٹا!', bgColor: 'bg-teal-50 border-teal-200 text-teal-900' },
  { id: 'ee', char: 'E', word: 'Elephant', englishWord: 'Elephant (ہاتھی)', icon: '🐘', category: 'english', spokenText: 'E for Elephant! ای فور ایلیفینٹ۔ ایلیفینٹ یعنی بڑا ہاتھی۔', bgColor: 'bg-stone-50 border-stone-200 text-stone-900' },
  { id: 'ef', char: 'F', word: 'Fish', englishWord: 'Fish (مچھلی)', icon: '🐟', category: 'english', spokenText: 'F for Fish! ایف فور فش۔ فش یعنی پانی کی رانی مچھلی۔', bgColor: 'bg-cyan-50 border-cyan-200 text-cyan-900' },
  { id: 'eg', char: 'G', word: 'Giraffe', englishWord: 'Giraffe (زرافہ)', icon: '🦒', category: 'english', spokenText: 'G for Giraffe! جی فور جراف۔ جراف یعنی لمبی گردن والا زرافہ۔', bgColor: 'bg-yellow-50 border-yellow-200 text-yellow-900' },
  { id: 'eh', char: 'H', word: 'Horse', englishWord: 'Horse (گھوڑا)', icon: '🐎', category: 'english', spokenText: 'H for Horse! ایچ فور ہارس۔ ہارس یعنی تیز دوڑنے والا گھوڑا۔ شاباش بیٹا!', bgColor: 'bg-orange-50 border-orange-200 text-orange-900' },
];
