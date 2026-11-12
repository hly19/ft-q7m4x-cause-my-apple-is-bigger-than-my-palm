// Built-in food list. Approximate USDA-style values per 100 g, as eaten (cooked where relevant).
// Accuracy target is ~80%: good enough for trends, not lab precision.

export type UnitKey =
  | 'g' | 'ml' | 'piece' | 'slice' | 'tsp' | 'tbsp' | 'cup' | 'scoop' | 'can' | 'serving'
  | 'palm' | 'cupped' | 'fist' | 'thumb';

export const HAND_UNITS: UnitKey[] = ['palm', 'cupped', 'fist', 'thumb'];

export interface FoodUnit {
  unit: UnitKey;
  grams: number;   // grams (or ml) in ONE unit, for a medium hand where relevant
  label?: string;  // overrides the default unit name, e.g. "glass (5 oz)"
}

export type Category = 'protein' | 'dairy' | 'carb' | 'veg' | 'fruit' | 'fat' | 'drink' | 'snack' | 'mixed';

export interface Macros { kcal: number; protein: number; carbs: number; fat: number }

export interface FoodDef {
  key: string;
  name: string;
  category: Category;
  per100g: Macros;
  units: FoodUnit[];   // first one is the default
  aliases?: string[];
  alcohol?: boolean;   // kcal includes alcohol (7 kcal/g), so 4/4/9 doesn't add up
}

type U = [UnitKey, number, string?];

function f(key: string, name: string, category: Category, m: [number, number, number, number], units: U[], aliases?: string[], extra?: Partial<FoodDef>): FoodDef {
  return {
    key,
    name,
    category,
    per100g: { kcal: m[0], protein: m[1], carbs: m[2], fat: m[3] },
    units: units.map(([unit, grams, label]) => ({ unit, grams, ...(label ? { label } : {}) })),
    ...(aliases ? { aliases } : {}),
    ...extra,
  };
}

const PALM: U = ['palm', 100];
const G: U = ['g', 1];
const ML: U = ['ml', 1];
const booze = { alcohol: true };

export const FOODS: FoodDef[] = [
  // ---- Protein (cooked) ----
  f('chicken-breast', 'Chicken breast', 'protein', [165, 31, 0, 3.6], [PALM, ['piece', 170, 'breast'], G], ['chicken']),
  f('chicken-thigh', 'Chicken thigh', 'protein', [209, 26, 0, 10.9], [PALM, ['piece', 100, 'thigh'], G], ['chicken']),
  f('chicken-wing', 'Chicken wing', 'protein', [254, 24, 0, 17], [['piece', 35, 'wing'], PALM, G], ['wings']),
  f('rotisserie-chicken', 'Rotisserie chicken (with skin)', 'protein', [215, 27, 0, 11.6], [PALM, G], ['chicken']),
  f('fried-chicken', 'Fried chicken, breaded', 'protein', [260, 25, 8, 14], [['piece', 140], PALM, G], ['chicken']),
  f('chicken-nuggets', 'Chicken nuggets', 'protein', [296, 15, 15, 20], [['piece', 16, 'nugget'], G]),
  f('ground-beef-80', 'Ground beef 80/20', 'protein', [254, 26, 0, 17], [PALM, ['piece', 113, 'patty'], G], ['beef', 'hamburger', 'mince']),
  f('ground-beef-90', 'Ground beef 90/10 (lean)', 'protein', [215, 26, 0, 11.5], [PALM, ['piece', 113, 'patty'], G], ['beef', 'mince', 'lean beef']),
  f('steak', 'Steak (sirloin)', 'protein', [200, 30, 0, 8], [PALM, ['piece', 225, 'steak'], G], ['beef']),
  f('pork-chop', 'Pork chop', 'protein', [196, 29, 0, 8], [PALM, ['piece', 150, 'chop'], G], ['pork']),
  f('bacon', 'Bacon', 'protein', [541, 37, 1.4, 42], [['slice', 8], G]),
  f('ham', 'Ham (deli)', 'protein', [107, 17, 2.5, 3.5], [['slice', 28], PALM, G]),
  f('turkey-deli', 'Turkey (deli)', 'protein', [100, 18, 3, 2], [['slice', 28], PALM, G]),
  f('ground-turkey', 'Ground turkey 93/7', 'protein', [200, 27, 0, 10], [PALM, G], ['turkey']),
  f('sausage', 'Sausage (pork)', 'protein', [300, 13, 2, 27], [['piece', 25, 'link'], G]),
  f('hot-dog', 'Hot dog (sausage only)', 'protein', [290, 10, 4, 26], [['piece', 50], G]),
  f('meatballs', 'Meatballs', 'protein', [230, 15, 7, 16], [['piece', 30, 'meatball'], PALM, G]),
  f('salmon', 'Salmon', 'protein', [206, 22, 0, 12.4], [PALM, ['piece', 150, 'fillet'], G], ['fish']),
  f('tuna-can', 'Tuna (canned in water)', 'protein', [116, 26, 0, 1], [['can', 120, 'can (drained)'], PALM, G], ['fish']),
  f('white-fish', 'White fish (cod, tilapia)', 'protein', [105, 23, 0, 0.9], [PALM, ['piece', 150, 'fillet'], G], ['fish', 'cod', 'tilapia']),
  f('shrimp', 'Shrimp', 'protein', [99, 24, 0.2, 0.3], [PALM, ['piece', 6, 'shrimp'], G], ['prawns']),
  f('egg', 'Egg', 'protein', [143, 12.6, 0.7, 9.5], [['piece', 50, 'egg'], G], ['eggs', 'fried egg', 'boiled egg', 'scrambled']),
  f('egg-white', 'Egg white', 'protein', [52, 11, 0.7, 0.2], [['piece', 33, 'white'], ['cup', 243], G]),
  f('tofu', 'Tofu (firm)', 'protein', [144, 15.8, 2.8, 8.7], [PALM, G]),
  f('whey', 'Protein powder (whey)', 'protein', [400, 80, 8, 6], [['scoop', 30], G], ['protein shake', 'shake', 'whey']),
  f('protein-bar', 'Protein bar', 'protein', [370, 33, 40, 10], [['piece', 60, 'bar'], G]),
  f('protein-shake-rtd', 'Protein shake (bottled)', 'drink', [49, 9.2, 2, 1.1], [['serving', 325, 'bottle'], ML], ['shake']),
  f('lentils', 'Lentils', 'carb', [116, 9, 20, 0.4], [['cupped', 100], ['cup', 198], G]),
  f('black-beans', 'Black beans', 'carb', [132, 8.9, 23.7, 0.5], [['cupped', 90], ['cup', 172], G], ['beans']),
  f('chickpeas', 'Chickpeas', 'carb', [164, 8.9, 27.4, 2.6], [['cupped', 90], ['cup', 164], G], ['garbanzo']),

  // ---- Dairy ----
  f('cheddar', 'Cheddar cheese', 'dairy', [403, 25, 1.3, 33], [['slice', 21], ['thumb', 20], ['tbsp', 7, 'tbsp shredded'], ['cup', 113, 'cup shredded'], G], ['cheese']),
  f('mozzarella', 'Mozzarella', 'dairy', [280, 28, 3, 17], [['slice', 28], ['thumb', 20], ['cup', 112, 'cup shredded'], G], ['cheese']),
  f('american-cheese', 'American cheese (processed)', 'dairy', [312, 16, 8, 24], [['slice', 20], G], ['cheese', 'kraft single']),
  f('swiss', 'Swiss cheese', 'dairy', [370, 27, 1.5, 28], [['slice', 28], ['thumb', 20], G], ['cheese']),
  f('parmesan', 'Parmesan (grated)', 'dairy', [420, 28, 14, 28], [['tbsp', 5], ['thumb', 10], G], ['cheese']),
  f('feta', 'Feta', 'dairy', [264, 14, 4, 21], [['thumb', 20], ['cup', 150, 'cup crumbled'], G], ['cheese']),
  f('cottage-cheese', 'Cottage cheese 2%', 'dairy', [84, 11, 4.3, 2.3], [['cupped', 110], ['cup', 226], G]),
  f('cream-cheese', 'Cream cheese', 'dairy', [342, 6, 4, 34], [['tbsp', 15], ['thumb', 15], G]),
  f('greek-yogurt', 'Greek yogurt, plain 2%', 'dairy', [73, 10, 4, 2], [['piece', 170, 'tub'], ['cupped', 120], ['cup', 245], G], ['yogurt', 'yoghurt']),
  f('greek-yogurt-0', 'Greek yogurt, nonfat', 'dairy', [59, 10, 3.6, 0.4], [['piece', 170, 'tub'], ['cupped', 120], ['cup', 245], G], ['yogurt', 'yoghurt']),
  f('yogurt-fruit', 'Yogurt, fruit flavoured', 'dairy', [97, 4, 17, 1.5], [['piece', 150, 'tub'], G], ['yogurt', 'yoghurt']),
  f('milk-skim', 'Milk, skim', 'drink', [34, 3.4, 5, 0.1], [['cup', 245], ML], ['milk']),
  f('milk-2', 'Milk, 2%', 'drink', [50, 3.3, 4.8, 2], [['cup', 245], ['tbsp', 15], ML], ['milk']),
  f('milk-whole', 'Milk, whole', 'drink', [61, 3.2, 4.8, 3.3], [['cup', 245], ['tbsp', 15], ML], ['milk']),
  f('oat-milk', 'Oat milk', 'drink', [46, 1, 6.7, 1.5], [['cup', 240], ML], ['milk']),
  f('almond-milk', 'Almond milk, unsweetened', 'drink', [15, 0.6, 0.6, 1.2], [['cup', 240], ML], ['milk']),
  f('soy-milk', 'Soy milk', 'drink', [45, 3.3, 3.5, 2], [['cup', 240], ML], ['milk']),
  f('heavy-cream', 'Heavy cream', 'dairy', [340, 2.8, 2.8, 36], [['tbsp', 15], ML], ['cream']),
  f('half-and-half', 'Half & half / coffee cream', 'dairy', [131, 3, 4.3, 11.5], [['tbsp', 15], ML], ['cream', 'creamer']),
  f('ice-cream', 'Ice cream', 'snack', [207, 3.5, 24, 11], [['scoop', 66], ['cup', 132], G]),
  f('butter', 'Butter', 'fat', [717, 0.9, 0.1, 81], [['tsp', 5], ['tbsp', 14], ['thumb', 14], G]),

  // ---- Fats, nuts, spreads ----
  f('olive-oil', 'Olive oil', 'fat', [884, 0, 0, 100], [['tbsp', 13.5], ['tsp', 4.5], ['thumb', 13.5], ML], ['oil']),
  f('vegetable-oil', 'Vegetable / canola oil', 'fat', [884, 0, 0, 100], [['tbsp', 13.5], ['tsp', 4.5], ['thumb', 13.5], ML], ['oil', 'cooking oil']),
  f('mayo', 'Mayonnaise', 'fat', [680, 1, 0.6, 75], [['tbsp', 14], ['tsp', 5], ['thumb', 14], G], ['mayonnaise']),
  f('peanut-butter', 'Peanut butter', 'fat', [588, 25, 20, 50], [['tbsp', 16], ['thumb', 16], G], ['pb']),
  f('almond-butter', 'Almond butter', 'fat', [614, 21, 19, 56], [['tbsp', 16], ['thumb', 16], G]),
  f('almonds', 'Almonds', 'fat', [579, 21, 22, 50], [['cupped', 30, 'handful'], ['thumb', 15], ['piece', 1.2, 'almond'], G], ['nuts']),
  f('peanuts', 'Peanuts', 'fat', [585, 24, 21, 50], [['cupped', 30, 'handful'], ['thumb', 15], G], ['nuts']),
  f('walnuts', 'Walnuts', 'fat', [654, 15, 14, 65], [['cupped', 30, 'handful'], ['thumb', 15], G], ['nuts']),
  f('cashews', 'Cashews', 'fat', [553, 18, 30, 44], [['cupped', 30, 'handful'], ['thumb', 15], G], ['nuts']),
  f('mixed-nuts', 'Mixed nuts', 'fat', [607, 20, 21, 54], [['cupped', 30, 'handful'], ['thumb', 15], G], ['nuts', 'trail mix']),
  f('avocado', 'Avocado', 'fat', [160, 2, 8.5, 14.7], [['piece', 150, 'avocado'], ['slice', 25], ['thumb', 30], G], ['guac']),
  f('guacamole', 'Guacamole', 'fat', [150, 2, 8.5, 13], [['tbsp', 15], ['thumb', 30], G], ['guac']),
  f('hummus', 'Hummus', 'fat', [166, 8, 14, 10], [['tbsp', 15], ['thumb', 15], G]),
  f('chia', 'Chia seeds', 'fat', [486, 17, 42, 31], [['tbsp', 12], G], ['seeds']),
  f('dark-chocolate', 'Dark chocolate 70%', 'snack', [600, 8, 46, 43], [['piece', 10, 'square'], G], ['chocolate']),
  f('ranch', 'Ranch / creamy dressing', 'fat', [430, 1, 6, 45], [['tbsp', 15], ['thumb', 15], ML], ['dressing', 'caesar']),
  f('vinaigrette', 'Vinaigrette dressing', 'fat', [290, 0, 9, 28], [['tbsp', 15], ['thumb', 15], ML], ['dressing', 'italian', 'balsamic']),

  // ---- Bread & grains ----
  f('white-bread', 'White bread', 'carb', [265, 9, 49, 3.2], [['slice', 28], G], ['bread', 'toast']),
  f('whole-wheat-bread', 'Whole wheat bread', 'carb', [252, 12.5, 43, 3.5], [['slice', 32], G], ['bread', 'toast', 'brown bread']),
  f('sourdough', 'Sourdough bread', 'carb', [270, 11, 51, 2.5], [['slice', 50], G], ['bread', 'toast']),
  f('bagel', 'Bagel', 'carb', [257, 10, 50, 1.6], [['piece', 100, 'bagel'], G], ['bread']),
  f('english-muffin', 'English muffin', 'carb', [227, 8.9, 44, 1.7], [['piece', 57], G], ['bread']),
  f('flour-tortilla', 'Flour tortilla (8")', 'carb', [312, 8, 52, 8], [['piece', 45, 'tortilla'], ['piece', 70, 'large wrap (10")'], G], ['wrap', 'tortilla']),
  f('corn-tortilla', 'Corn tortilla', 'carb', [218, 5.7, 44.6, 2.8], [['piece', 26, 'tortilla'], G], ['taco', 'tortilla']),
  f('pita', 'Pita', 'carb', [275, 9, 56, 1.2], [['piece', 60, 'pita'], G], ['bread']),
  f('croissant', 'Croissant', 'carb', [406, 8, 46, 21], [['piece', 57], G]),
  f('muffin', 'Muffin (bakery)', 'snack', [377, 4.4, 54, 16], [['piece', 113, 'muffin'], G]),
  f('white-rice', 'White rice', 'carb', [130, 2.7, 28, 0.3], [['cupped', 90], ['cup', 158], G], ['rice']),
  f('brown-rice', 'Brown rice', 'carb', [123, 2.7, 25.6, 1], [['cupped', 90], ['cup', 195], G], ['rice']),
  f('fried-rice', 'Fried rice', 'mixed', [174, 5, 26, 5.5], [['cupped', 100], ['cup', 198], G], ['rice']),
  f('pasta', 'Pasta', 'carb', [158, 5.8, 31, 0.9], [['cupped', 90], ['cup', 140], G], ['spaghetti', 'noodles', 'macaroni', 'penne']),
  f('quinoa', 'Quinoa', 'carb', [120, 4.4, 21.3, 1.9], [['cupped', 90], ['cup', 185], G]),
  f('couscous', 'Couscous', 'carb', [112, 3.8, 23, 0.2], [['cupped', 90], ['cup', 157], G]),
  f('oats', 'Oats (dry)', 'carb', [379, 13, 68, 6.5], [['cupped', 40, '½ cup dry'], ['cup', 80], G], ['oatmeal', 'porridge']),
  f('oatmeal-cooked', 'Oatmeal, cooked with water', 'carb', [71, 2.5, 12, 1.5], [['cupped', 117], ['cup', 234], G], ['porridge', 'oats']),
  f('granola', 'Granola', 'carb', [471, 10, 64, 20], [['cupped', 60, '½ cup'], ['cup', 120], G]),
  f('cereal', 'Breakfast cereal', 'carb', [370, 7, 84, 2], [['cup', 30], G], ['cornflakes', 'cheerios']),
  f('potato', 'Potato, baked/boiled', 'carb', [93, 2.5, 21, 0.1], [['piece', 173, 'medium potato'], ['cupped', 100], G], ['potatoes']),
  f('sweet-potato', 'Sweet potato', 'carb', [90, 2, 20.7, 0.2], [['piece', 150], ['cupped', 100], G]),
  f('mashed-potatoes', 'Mashed potatoes', 'carb', [113, 2, 16, 4.2], [['cupped', 105], ['cup', 210], G], ['potatoes']),
  f('fries', 'French fries', 'carb', [312, 3.4, 41, 15], [['serving', 117, 'medium order'], ['serving', 71, 'small order'], ['cupped', 50], G], ['chips', 'frites']),
  f('pancake', 'Pancake (4")', 'carb', [227, 6.4, 28, 10], [['piece', 40, 'pancake'], G]),
  f('waffle', 'Waffle', 'carb', [291, 7.9, 33, 14], [['piece', 75, 'waffle'], G]),
  f('crackers', 'Crackers', 'snack', [421, 9.5, 74, 9], [['piece', 3, 'cracker'], ['cupped', 30], G]),
  f('rice-cake', 'Rice cake', 'snack', [387, 8, 82, 2.8], [['piece', 9], G]),
  f('ramen', 'Instant ramen (whole pack)', 'mixed', [440, 9, 63, 17], [['piece', 85, 'pack'], G], ['noodles']),

  // ---- Mixed dishes / takeout ----
  f('pizza-cheese', 'Pizza, cheese', 'mixed', [266, 11, 33, 10], [['slice', 107], G]),
  f('pizza-pepperoni', 'Pizza, pepperoni', 'mixed', [276, 12, 30, 12], [['slice', 110], G]),
  f('burger', 'Burger (single patty, bun)', 'mixed', [260, 13, 26, 12], [['piece', 120, 'burger'], G], ['hamburger', 'cheeseburger']),
  f('burrito', 'Burrito (bean & cheese)', 'mixed', [200, 7, 28, 7], [['piece', 220, 'burrito'], G]),
  f('sushi', 'Sushi roll (e.g. California)', 'mixed', [140, 3, 20, 5], [['piece', 30, 'piece'], G]),
  f('lasagna', 'Lasagna', 'mixed', [138, 8, 13, 6], [['serving', 250, 'plate'], ['cupped', 125], G]),
  f('mac-cheese', 'Mac & cheese', 'mixed', [164, 6.6, 18, 7], [['cup', 200], ['cupped', 100], G]),
  f('chicken-soup', 'Chicken noodle soup', 'mixed', [31, 2, 3.5, 1], [['cup', 240], ML], ['soup']),

  // ---- Vegetables ----
  f('broccoli', 'Broccoli', 'veg', [35, 2.4, 7.2, 0.4], [['fist', 80], ['cup', 156], G]),
  f('spinach', 'Spinach', 'veg', [23, 2.9, 3.6, 0.4], [['fist', 30], G]),
  f('salad-greens', 'Lettuce / salad greens', 'veg', [15, 1.4, 2.9, 0.2], [['fist', 50], G], ['salad', 'lettuce']),
  f('carrot', 'Carrot', 'veg', [41, 0.9, 9.6, 0.2], [['piece', 61, 'carrot'], ['fist', 80], G]),
  f('tomato', 'Tomato', 'veg', [18, 0.9, 3.9, 0.2], [['piece', 123, 'tomato'], ['slice', 20], G]),
  f('cucumber', 'Cucumber', 'veg', [15, 0.7, 3.6, 0.1], [['fist', 100], ['slice', 7], G]),
  f('bell-pepper', 'Bell pepper', 'veg', [31, 1, 6, 0.3], [['piece', 120, 'pepper'], ['fist', 90], G], ['pepper']),
  f('onion', 'Onion', 'veg', [40, 1.1, 9.3, 0.1], [['fist', 90], ['piece', 110, 'onion'], G]),
  f('mushrooms', 'Mushrooms', 'veg', [22, 3.1, 3.3, 0.3], [['fist', 70], G]),
  f('green-beans', 'Green beans', 'veg', [35, 1.9, 7.9, 0.3], [['fist', 80], G]),
  f('corn', 'Corn', 'veg', [96, 3.4, 19, 1.3], [['cupped', 80], ['piece', 90, 'cob'], G]),
  f('peas', 'Peas', 'veg', [84, 5.4, 15.6, 0.2], [['cupped', 80], G]),
  f('cauliflower', 'Cauliflower', 'veg', [25, 1.9, 5, 0.3], [['fist', 80], G]),
  f('zucchini', 'Zucchini', 'veg', [17, 1.2, 3.1, 0.3], [['fist', 90], G], ['courgette']),
  f('mixed-veg', 'Mixed vegetables', 'veg', [65, 3, 13, 0.2], [['fist', 90], G], ['veggies', 'stir fry veg']),

  // ---- Fruit ----
  f('banana', 'Banana', 'fruit', [89, 1.1, 22.8, 0.3], [['piece', 118, 'banana'], G]),
  f('apple', 'Apple', 'fruit', [52, 0.3, 13.8, 0.2], [['piece', 182, 'apple'], ['slice', 20], G]),
  f('orange', 'Orange', 'fruit', [47, 0.9, 11.8, 0.1], [['piece', 131, 'orange'], G], ['clementine']),
  f('strawberries', 'Strawberries', 'fruit', [32, 0.7, 7.7, 0.3], [['fist', 150], ['piece', 12, 'berry'], G], ['berries']),
  f('blueberries', 'Blueberries', 'fruit', [57, 0.7, 14.5, 0.3], [['fist', 148], ['cupped', 75], G], ['berries']),
  f('grapes', 'Grapes', 'fruit', [69, 0.7, 18, 0.2], [['fist', 150], ['piece', 5, 'grape'], G]),
  f('pear', 'Pear', 'fruit', [57, 0.4, 15, 0.1], [['piece', 178, 'pear'], G]),
  f('mango', 'Mango', 'fruit', [60, 0.8, 15, 0.4], [['fist', 165], ['piece', 200, 'mango'], G]),
  f('pineapple', 'Pineapple', 'fruit', [50, 0.5, 13, 0.1], [['fist', 165], G]),
  f('watermelon', 'Watermelon', 'fruit', [30, 0.6, 7.6, 0.2], [['fist', 150], ['slice', 280], G]),
  f('raisins', 'Raisins', 'fruit', [299, 3, 79, 0.5], [['tbsp', 9], ['cupped', 40], G]),
  f('dates', 'Dates', 'fruit', [277, 1.8, 75, 0.2], [['piece', 24, 'date'], G]),
  f('orange-juice', 'Orange juice', 'drink', [45, 0.7, 10.4, 0.2], [['cup', 248], ML], ['juice', 'oj']),

  // ---- Drinks ----
  f('coffee', 'Coffee, black', 'drink', [2, 0.3, 0, 0], [['cup', 240], ML], ['espresso', 'americano']),
  f('latte', 'Latte, whole milk', 'drink', [40, 2.1, 3.2, 2.1], [['serving', 473, 'medium (16 oz)'], ['serving', 355, 'small (12 oz)'], ML], ['cappuccino', 'flat white', 'coffee']),
  f('latte-skim', 'Latte, skim milk', 'drink', [27, 2.7, 3.9, 0.1], [['serving', 473, 'medium (16 oz)'], ['serving', 355, 'small (12 oz)'], ML], ['cappuccino', 'coffee']),
  f('soda', 'Soda (regular)', 'drink', [42, 0, 10.6, 0], [['can', 355], ML], ['coke', 'pop', 'cola']),
  f('diet-soda', 'Diet soda', 'drink', [0, 0, 0, 0], [['can', 355], ML], ['coke zero', 'diet coke']),
  f('beer', 'Beer', 'drink', [43, 0.5, 3.6, 0], [['can', 355, 'can / bottle'], ['serving', 473, 'pint'], ML], undefined, booze),
  f('light-beer', 'Light beer', 'drink', [29, 0.2, 1.6, 0], [['can', 355, 'can / bottle'], ML], ['beer'], booze),
  f('red-wine', 'Red wine', 'drink', [85, 0.1, 2.6, 0], [['serving', 150, 'glass (5 oz)'], ML], ['wine'], booze),
  f('white-wine', 'White wine', 'drink', [82, 0.1, 2.6, 0], [['serving', 150, 'glass (5 oz)'], ML], ['wine'], booze),
  f('spirits', 'Spirits (vodka, whisky…)', 'drink', [231, 0, 0, 0], [['serving', 44, 'shot'], ML], ['vodka', 'whisky', 'rum', 'gin', 'tequila'], booze),
  f('smoothie', 'Fruit smoothie', 'drink', [55, 1, 13, 0.3], [['cup', 240], ['serving', 473, 'medium'], ML]),
  f('sports-drink', 'Sports drink', 'drink', [26, 0, 6.4, 0], [['serving', 591, 'bottle'], ML], ['gatorade']),

  // ---- Snacks & sweets ----
  f('granola-bar', 'Granola bar', 'snack', [471, 10, 64, 20], [['piece', 24, 'bar'], G]),
  f('cookie', 'Cookie (chocolate chip)', 'snack', [488, 5, 64, 24], [['piece', 16, 'cookie'], ['piece', 60, 'large bakery cookie'], G]),
  f('brownie', 'Brownie', 'snack', [405, 5, 50, 21], [['piece', 56], G]),
  f('donut', 'Donut, glazed', 'snack', [421, 5, 51, 22], [['piece', 60, 'donut'], G], ['doughnut']),
  f('chocolate-bar', 'Milk chocolate', 'snack', [535, 7.6, 59, 30], [['serving', 44, 'bar'], ['piece', 10, 'square'], G], ['chocolate', 'candy bar']),
  f('gummies', 'Gummy candy', 'snack', [330, 6, 77, 0], [['piece', 2.5, 'gummy'], ['cupped', 40], G], ['candy']),
  f('potato-chips', 'Potato chips / crisps', 'snack', [536, 7, 53, 34], [['cupped', 28, 'handful'], ['piece', 2, 'chip'], G], ['chips', 'crisps']),
  f('tortilla-chips', 'Tortilla chips', 'snack', [489, 7, 63, 23], [['cupped', 28, 'handful'], ['piece', 2.5, 'chip'], G], ['nachos', 'chips']),
  f('pretzels', 'Pretzels', 'snack', [380, 10, 80, 3], [['cupped', 28, 'handful'], G]),
  f('popcorn', 'Popcorn (air-popped)', 'snack', [387, 13, 78, 4.5], [['cup', 8], G]),
  f('honey', 'Honey', 'snack', [304, 0.3, 82, 0], [['tsp', 7], ['tbsp', 21], G]),
  f('sugar', 'Sugar', 'snack', [387, 0, 100, 0], [['tsp', 4], ['tbsp', 12], G]),
  f('jam', 'Jam', 'snack', [250, 0.4, 64, 0.1], [['tbsp', 20], ['tsp', 7], G], ['jelly']),
  f('maple-syrup', 'Maple syrup', 'snack', [260, 0, 67, 0.1], [['tbsp', 20], ML], ['syrup']),
  f('ketchup', 'Ketchup', 'snack', [101, 1, 26, 0.1], [['tbsp', 17], G]),
];

/** Shown when the search box is empty and there's no history yet. */
export const COMMON_KEYS = [
  'egg', 'white-bread', 'cheddar', 'butter', 'chicken-breast', 'white-rice',
  'banana', 'greek-yogurt', 'whey', 'milk-2', 'peanut-butter', 'broccoli',
];
