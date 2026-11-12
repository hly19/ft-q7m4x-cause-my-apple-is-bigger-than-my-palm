// Restaurant / takeout dishes. Approximate per-100 g values for typical restaurant recipes,
// sauce and cooking oil included. Portions are typical restaurant servings; they vary a lot.

import { f, G, type FoodDef, type U } from './foodDef';

const plate = (g: number, label = 'restaurant portion'): U => ['serving', g, label];
const cup = (g = 240): U => ['cup', g];
const cupped = (g = 120): U => ['cupped', g];
const piece = (g: number, label?: string): U => ['piece', g, label];
const d = (key: string, name: string, m: [number, number, number, number], units: U[], aliases?: string[]) =>
  f(key, name, 'dish', m, [...units, G], aliases);

export const DISHES: FoodDef[] = [
  // ---- Indian ----
  d('butter-chicken', 'Butter chicken', [150, 11, 5, 9.5], [plate(350, 'restaurant portion (no rice)'), cup(), cupped()], ['murgh makhani', 'indian', 'curry']),
  d('tikka-masala', 'Chicken tikka masala', [140, 11, 6, 8], [plate(350, 'restaurant portion (no rice)'), cup(), cupped()], ['indian', 'curry']),
  d('korma', 'Chicken korma', [170, 10, 7, 11.5], [plate(350, 'restaurant portion (no rice)'), cup(), cupped()], ['indian', 'curry']),
  d('vindaloo', 'Vindaloo', [130, 11, 6, 7], [plate(350, 'restaurant portion (no rice)'), cup(), cupped()], ['indian', 'curry']),
  d('chana-masala', 'Chana masala', [130, 5, 16, 5], [plate(300), cup(), cupped()], ['chickpea curry', 'indian']),
  d('dal', 'Dal (lentil curry)', [110, 6, 14, 3.5], [plate(300), cup(), cupped()], ['daal', 'dhal', 'indian']),
  d('palak-paneer', 'Palak / saag paneer', [150, 7, 6, 11], [plate(300), cup(), cupped()], ['indian', 'spinach']),
  d('biryani', 'Chicken biryani', [170, 9, 20, 6], [plate(400, 'plate'), cup(200), cupped(100)], ['indian', 'rice']),
  d('basmati-rice', 'Basmati rice (restaurant)', [150, 3, 30, 2], [plate(250, 'restaurant side'), cupped(90), cup(160)], ['rice', 'pilaf', 'indian']),
  d('naan', 'Naan', [290, 9, 50, 6], [piece(90, 'naan'), piece(45, '½ naan')], ['bread', 'indian']),
  d('garlic-naan', 'Garlic naan (buttered)', [310, 9, 48, 9.5], [piece(100, 'naan'), piece(50, '½ naan')], ['bread', 'indian']),
  d('samosa', 'Samosa', [260, 5, 30, 13.5], [piece(100, 'samosa')], ['indian']),
  d('pakora', 'Pakora', [280, 7, 25, 17], [piece(25, 'pakora')], ['bhaji', 'indian']),

  // ---- Thai / Vietnamese ----
  d('pad-thai', 'Pad thai', [175, 8, 23, 6], [plate(400, 'restaurant plate'), cup(200), cupped(100)], ['thai', 'noodles']),
  d('pad-see-ew', 'Pad see ew', [170, 8, 24, 5], [plate(400, 'restaurant plate'), cup(200)], ['thai', 'noodles']),
  d('green-curry', 'Thai green curry (chicken)', [130, 9, 5, 8.5], [plate(350, 'restaurant portion (no rice)'), cup(), cupped()], ['thai', 'curry']),
  d('red-curry', 'Thai red curry (chicken)', [130, 9, 5, 8.5], [plate(350, 'restaurant portion (no rice)'), cup(), cupped()], ['thai', 'curry']),
  d('massaman', 'Massaman curry', [150, 8, 9, 9], [plate(350, 'restaurant portion (no rice)'), cup(), cupped()], ['thai', 'curry']),
  d('tom-yum', 'Tom yum soup', [40, 4, 3, 1.5], [['serving', 350, 'bowl'], cup()], ['thai', 'soup']),
  d('spring-roll', 'Spring roll (fried)', [250, 6, 28, 12.5], [piece(60, 'roll')], ['imperial roll', 'egg roll', 'thai', 'vietnamese']),
  d('summer-roll', 'Fresh / summer roll', [130, 5, 22, 2.5], [piece(100, 'roll')], ['rice paper roll', 'vietnamese']),
  d('pho', 'Pho (beef noodle soup)', [60, 4.5, 7, 1.5], [['serving', 750, 'regular bowl'], ['serving', 550, 'small bowl'], ['serving', 1000, 'large bowl']], ['vietnamese', 'soup', 'noodles']),
  d('banh-mi', 'Bánh mì', [230, 10, 30, 7.5], [piece(230, 'sandwich')], ['vietnamese', 'sandwich', 'banh mi']),
  d('bun', 'Vermicelli bowl (bún)', [140, 7, 20, 3.5], [['serving', 450, 'bowl']], ['vietnamese', 'noodles', 'bun bo', 'bun cha']),
  d('mango-sticky-rice', 'Mango sticky rice', [230, 3, 40, 7], [plate(200)], ['thai', 'dessert']),

  // ---- Chinese ----
  d('general-tao', 'General Tao chicken', [260, 13, 25, 12], [plate(300), cup(150), cupped(100)], ['general tso', 'chinese']),
  d('sweet-sour-pork', 'Sweet & sour pork', [230, 9, 27, 9.5], [plate(300), cup(150), cupped(100)], ['chinese']),
  d('orange-chicken', 'Orange chicken', [250, 13, 26, 10.5], [plate(300), cup(150), cupped(100)], ['chinese']),
  d('kung-pao', 'Kung pao chicken', [160, 12, 9, 9], [plate(350), cup(160), cupped(100)], ['chinese']),
  d('beef-broccoli', 'Beef & broccoli', [120, 10, 7, 6], [plate(350), cup(160), cupped(100)], ['chinese']),
  d('lo-mein', 'Lo mein', [160, 7, 22, 5], [plate(350), cup(200), cupped(100)], ['chinese', 'noodles']),
  d('chow-mein', 'Chow mein', [150, 7, 18, 5.5], [plate(350), cup(200), cupped(100)], ['chinese', 'noodles']),
  d('singapore-noodles', 'Singapore noodles', [160, 7, 20, 6], [plate(350), cup(200)], ['chinese', 'noodles']),
  d('egg-roll', 'Egg roll', [220, 7, 22, 11.5], [piece(90, 'roll')], ['chinese']),
  d('dumplings-steamed', 'Dumplings, steamed', [190, 8, 25, 6], [piece(25, 'dumpling')], ['chinese', 'dim sum', 'bao']),
  d('potstickers', 'Dumplings, pan-fried (potstickers)', [230, 8, 25, 11], [piece(25, 'dumpling')], ['chinese', 'dim sum']),
  d('wonton-soup', 'Wonton soup', [60, 4, 7, 1.8], [['serving', 450, 'bowl'], cup()], ['chinese', 'soup']),
  d('hot-sour-soup', 'Hot & sour soup', [45, 3, 5, 1.5], [['serving', 350, 'bowl'], cup()], ['chinese', 'soup']),

  // ---- Japanese ----
  d('nigiri', 'Sushi nigiri', [150, 7, 25, 2], [piece(35, 'piece')], ['sushi', 'japanese']),
  d('maki-roll', 'Sushi maki roll', [150, 5, 25, 3], [['serving', 180, 'roll (6 pieces)'], piece(30, 'piece')], ['sushi', 'japanese']),
  d('specialty-roll', 'Sushi specialty roll (tempura, mayo)', [200, 6, 26, 8], [['serving', 250, 'roll (8 pieces)'], piece(30, 'piece')], ['sushi', 'dragon roll', 'spicy', 'japanese']),
  d('sashimi', 'Sashimi', [150, 22, 0, 6.5], [piece(15, 'slice')], ['sushi', 'japanese', 'raw fish']),
  d('tonkotsu-ramen', 'Ramen (restaurant, pork broth)', [90, 4.5, 9, 4], [['serving', 800, 'bowl']], ['japanese', 'noodles', 'soup']),
  d('miso-soup', 'Miso soup', [25, 2, 2.5, 1], [['serving', 240, 'bowl']], ['japanese', 'soup']),
  d('teriyaki-chicken', 'Teriyaki chicken (no rice)', [170, 18, 9, 7], [plate(250), ['palm', 100]], ['japanese']),
  d('katsu-curry', 'Katsu curry with rice', [170, 7, 22, 6], [plate(500, 'plate')], ['japanese', 'curry']),
  d('tempura', 'Tempura (shrimp or veg)', [230, 8, 20, 13], [piece(25, 'piece')], ['japanese']),
  d('gyoza', 'Gyoza', [220, 8, 24, 10], [piece(20, 'gyoza')], ['japanese', 'dumplings']),
  d('poke-bowl', 'Poke bowl', [150, 9, 18, 4.5], [['serving', 450, 'bowl']], ['hawaiian', 'japanese', 'sushi bowl']),

  // ---- Korean ----
  d('bibimbap', 'Bibimbap', [130, 6, 18, 4], [['serving', 500, 'bowl']], ['korean', 'rice']),
  d('bulgogi', 'Bulgogi (no rice)', [190, 17, 8, 10], [plate(250), ['palm', 100]], ['korean', 'beef']),
  d('korean-fried-chicken', 'Korean fried chicken', [280, 16, 15, 17.5], [piece(40, 'piece'), plate(250)], ['korean', 'kfc', 'wings']),
  d('japchae', 'Japchae', [140, 4, 22, 4], [plate(250), cup(150)], ['korean', 'noodles']),
  d('kimchi', 'Kimchi', [15, 1.1, 2.4, 0.5], [['cupped', 50], ['tbsp', 15]], ['korean']),

  // ---- Fast food / Québec ----
  d('poutine', 'Poutine', [230, 7, 22, 13], [['serving', 380, 'regular'], ['serving', 250, 'small'], ['serving', 550, 'large']], ['fries', 'quebec']),
  d('smoked-meat', 'Smoked meat sandwich', [240, 15, 20, 11], [piece(230, 'sandwich')], ['montreal', 'quebec', 'pastrami']),
  d('shawarma-wrap', 'Shawarma wrap (chicken)', [210, 12, 20, 9], [piece(300, 'wrap')], ['lebanese', 'pita', 'kebab']),
  d('shawarma-plate', 'Shawarma plate (rice, potatoes, salad)', [160, 10, 15, 7], [plate(550, 'plate')], ['lebanese', 'kebab']),
  d('steame', 'Steamed hot dog (steamé)', [240, 8, 22, 13], [piece(110, 'hot dog')], ['quebec', 'hot dog', 'steamie']),
  d('club-sandwich', 'Club sandwich', [230, 14, 18, 11], [piece(300, 'sandwich')], ['sandwich']),
  d('fish-chips', 'Fish & chips', [220, 10, 22, 10.5], [plate(450, 'plate')], ['fish']),
  d('wings-sauce', 'Chicken wings with sauce', [260, 20, 3, 19], [piece(35, 'wing'), ['serving', 350, '10 wings']], ['buffalo', 'wings']),
  d('chicken-strips', 'Chicken strips / tenders', [260, 17, 15, 15], [piece(45, 'strip')], ['tenders', 'fingers']),
  d('onion-rings', 'Onion rings', [330, 4, 38, 18], [['serving', 120, 'medium order']]),
  d('sub-turkey', 'Sub sandwich, turkey', [190, 11, 26, 4.5], [['serving', 230, '6 inch'], ['serving', 460, '12 inch']], ['subway', 'sandwich']),
  d('sub-italian', 'Sub sandwich, Italian / cold cuts', [250, 11, 25, 12], [['serving', 230, '6 inch'], ['serving', 460, '12 inch']], ['subway', 'sandwich']),
  d('quarter-burger', 'Burger, quarter pound with cheese', [250, 14, 18, 13.5], [piece(200, 'burger')], ['hamburger', 'cheeseburger', 'big mac']),
  d('double-burger', 'Burger, double patty', [270, 16, 15, 16], [piece(280, 'burger')], ['hamburger', 'cheeseburger']),
  d('chicken-sandwich', 'Crispy chicken sandwich', [250, 12, 24, 12], [piece(220, 'sandwich')], ['burger']),
  d('caesar-wrap', 'Chicken caesar wrap', [230, 12, 18, 12], [piece(280, 'wrap')], ['wrap']),
  d('milkshake', 'Milkshake', [120, 3, 18, 4], [['serving', 470, 'medium'], ['serving', 350, 'small']], ['shake']),
  d('bagel-cream-cheese', 'Bagel with cream cheese', [280, 9, 40, 9], [piece(130, 'bagel')], ['breakfast']),
  d('breakfast-sandwich', 'Breakfast sandwich (egg, cheese, meat)', [230, 13, 22, 10], [piece(140, 'sandwich')], ['mcmuffin', 'breakfast']),
  d('hash-browns', 'Hash browns', [270, 2.5, 28, 17], [piece(55, 'patty')], ['breakfast', 'potatoes']),
  d('pate-chinois', 'Pâté chinois (shepherd’s pie)', [130, 6, 12, 6.5], [plate(300, 'plate'), cup(220)], ['quebec', 'shepherds pie', 'pate chinois']),
  d('tourtiere', 'Tourtière (meat pie)', [280, 10, 20, 18], [['slice', 150]], ['quebec', 'meat pie']),
  d('pea-soup', 'Pea soup', [75, 4.5, 10, 2], [['serving', 300, 'bowl'], cup()], ['quebec', 'soupe aux pois', 'soup']),

  // ---- Italian ----
  d('spaghetti-bolognese', 'Spaghetti bolognese', [150, 7, 19, 5], [plate(450, 'restaurant plate'), cup(220), cupped(100)], ['pasta', 'meat sauce', 'italian']),
  d('fettuccine-alfredo', 'Fettuccine alfredo', [210, 7, 20, 11.5], [plate(450, 'restaurant plate'), cup(200), cupped(100)], ['pasta', 'cream sauce', 'italian']),
  d('carbonara', 'Spaghetti carbonara', [220, 9, 22, 10.5], [plate(400, 'restaurant plate'), cup(200), cupped(100)], ['pasta', 'italian']),
  d('penne-arrabbiata', 'Penne arrabbiata / tomato sauce', [140, 4.5, 24, 3], [plate(400, 'restaurant plate'), cup(220), cupped(100)], ['pasta', 'marinara', 'italian']),
  d('chicken-parm', 'Chicken parmesan (no pasta)', [210, 17, 10, 11.5], [plate(300), ['palm', 120]], ['italian', 'parmigiana']),
  d('risotto', 'Risotto', [150, 4, 20, 6], [plate(350), cup(200)], ['italian', 'rice']),
  d('garlic-bread', 'Garlic bread', [350, 8, 42, 16.5], [['slice', 40]], ['bread', 'italian']),

  // ---- Mexican ----
  d('taco-beef', 'Taco, beef', [220, 10, 18, 12], [piece(100, 'taco')], ['mexican']),
  d('taco-chicken', 'Taco, chicken', [190, 12, 18, 8], [piece(100, 'taco')], ['mexican']),
  d('taco-fish', 'Taco, fish', [210, 10, 20, 10], [piece(110, 'taco')], ['mexican']),
  d('burrito-chicken', 'Burrito, chicken', [180, 10, 22, 6], [piece(350, 'burrito')], ['mexican', 'chipotle']),
  d('burrito-steak', 'Burrito, steak', [190, 11, 21, 7], [piece(350, 'burrito')], ['mexican', 'chipotle']),
  d('burrito-bowl', 'Burrito bowl', [130, 8, 15, 4.5], [['serving', 500, 'bowl']], ['mexican', 'chipotle']),
  d('quesadilla', 'Quesadilla', [280, 13, 24, 15], [plate(200, 'quesadilla')], ['mexican']),
  d('nachos', 'Nachos with cheese & toppings', [320, 9, 32, 18], [plate(300, 'plate'), ['cupped', 50]], ['mexican']),
  d('enchiladas', 'Enchilada', [170, 9, 16, 8], [piece(150, 'enchilada')], ['mexican']),

  // ---- Greek / Middle Eastern ----
  d('souvlaki-plate', 'Souvlaki plate (rice, potatoes, salad)', [160, 10, 15, 7], [plate(550, 'plate')], ['greek', 'brochette']),
  d('gyro', 'Gyro / souvlaki pita', [230, 11, 22, 11], [piece(280, 'pita')], ['greek', 'pita']),
  d('falafel-wrap', 'Falafel wrap', [220, 7, 28, 9], [piece(280, 'wrap')], ['lebanese', 'vegetarian']),

  // ---- Salads ----
  d('caesar-salad', 'Caesar salad (with dressing)', [190, 6, 8, 15], [['serving', 150, 'side'], ['serving', 300, 'meal bowl'], ['fist', 60]], ['salad']),
  d('greek-salad', 'Greek salad (with dressing)', [110, 3, 5, 9], [['serving', 150, 'side'], ['serving', 300, 'meal bowl'], ['fist', 80]], ['salad']),
  d('cobb-salad', 'Cobb salad (with dressing)', [150, 9, 4, 11], [['serving', 400, 'meal bowl'], ['fist', 80]], ['salad']),

  // ---- Breakfast / comfort ----
  d('breakfast-plate', 'Breakfast plate (2 eggs, bacon, toast, potatoes)', [210, 10, 15, 12.5], [plate(400, 'plate')], ['breakfast', 'brunch']),
  d('eggs-benedict', 'Eggs Benedict', [230, 11, 13, 15], [plate(280, '2 eggs')], ['breakfast', 'brunch']),
  d('pancakes-syrup', 'Pancakes with syrup & butter', [230, 5, 38, 6.5], [plate(300, '3 pancakes')], ['breakfast', 'brunch']),
  d('chicken-pot-pie', 'Chicken pot pie', [230, 8, 20, 13], [piece(300, 'pie')], ['comfort']),
];
