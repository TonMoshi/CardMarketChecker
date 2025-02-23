const fs = require('node:fs');
const threshold = process.argv[2];

const exportCardsToList = process.argv.length > 3 && process.argv[3] === 'true' ? true : false;
const { priceGuides } = JSON.parse(fs.readFileSync('./input/price_guide_1.json', 'utf8'));
const { products } = JSON.parse(fs.readFileSync('./input/products_singles_1.json', 'utf8'));
let cards;
let consolidatedData;

try {
  if (!priceGuides || !products) {
    console.error('You can download price_guide from https://www.cardmarket.com/en/Magic/Data/Price-Guide');
    console.error('You can download product_singles from https://www.cardmarket.com/en/Magic/Data/Product-List');
    throw new Error('ERROR AT READING FILES: priceGuides or products is null');
  }
  cards = JSON.parse(fs.readFileSync('./input/cards.json'));

  if (!cards) {
    throw new Error('ERROR AT READING FILE: cards is null');
  }

  consolidatedData = JSON.parse(fs.readFileSync('./consolidatedData.json'));
} catch (err) {
  console.error('ERROR AT READING FILES:');
  console.error(err);
}

console.log('Threshold: ' + threshold);

try {
  if (!consolidatedData) {
    consolidatedData = products.map((product) => {
      const priceGuide = priceGuides.find((priceGuide) => priceGuide.idProduct === product.idProduct);
      return {
        idProduct: product.idProduct,
        name: product.name,
        trend: priceGuide && priceGuide.trend ? priceGuide.trend : -1,
      };
    });
    fs.writeFileSync('./consolidatedData.json', JSON.stringify(consolidatedData, null, 2));
  }
} catch (err) {
  console.error("ERROR AT CONSOLIDATING DATA FROM 'products' AND 'priceGuides':");
  console.error(err);
}

let expensiveCards = [];
let cheapCards = [];
let errorCards = [];
const thresholdMoney = threshold ? threshold : 1;

cards.forEach((card) => {
  const dataForCard = consolidatedData
    .filter((data) => data.name === card)
    .reduce(
      (agg, next) => {
        const d = agg && agg.price > next.trend && next.trend !== -1 ? { card: next.name, price: next.trend } : agg;
        return d;
      },
      { card: card, price: 1000000 }
    );

  if (!dataForCard || dataForCard.price === -1) {
    errorCards.push(card);
  } else {
    if (dataForCard.price > thresholdMoney) {
      expensiveCards.push(dataForCard);
    } else {
      cheapCards.push(dataForCard);
    }
  }
});

const cheapCost = cheapCards.reduce((acc, next) => acc + next.price, 0);
const expensiveCount = expensiveCards.length;
const cheapCount = cheapCards.length;
const errorCount = errorCards.length;
try {
  expensiveCards.sort((a, b) => b.price - a.price);
  cheapCards.sort((a, b) => b.price - a.price);
  if (exportCardsToList) {
    expensiveCards = expensiveCards.reduce((agg, next) => agg + next.card + '\n', '');
    cheapCards = cheapCards.reduce((agg, next) => agg + next.card + '\n', '');
    errorCards = errorCards.reduce((agg, next) => agg + next + '\n', '');
  } else {
    expensiveCards = JSON.stringify(expensiveCards, null, 2);
    cheapCards = JSON.stringify(cheapCards, null, 2);
    errorCards = JSON.stringify(errorCards, null, 2);
  }
  fs.writeFileSync('./output/expensiveCards.json', expensiveCards);
  fs.writeFileSync('./output/cheapCards.json', cheapCards);
  fs.writeFileSync('./output/errorCards.json', errorCards);
} catch (err) {
  console.error('ERROR AT WRITING FILES WITH THE EXPENSIVE AND CHEAP CARDS:');
  console.error(err);
} finally {
  console.log('Process finished');
  if (exportCardsToList) {
    console.log('CARDS EXPORTED WITHOUT PRICE');
  } else {
    console.log('EXPENSIVE: ' + expensiveCount);
    console.log('CHEAP: ' + cheapCount + ' ' + cheapCost + '$');
    console.log('ERROR: ' + errorCount);
  }
}

// {
//   idProduct: 1,
//   idCategory: 1,
//   avg: 0.08,
//   low: 0.02,
//   trend: 0.1,
//   avg1: 0.02,
//   avg7: 0.04,
//   avg30: 0.06,
//   'avg-foil': null,
//   'low-foil': 0.04,
//   'trend-foil': 0.29,
//   'avg1-foil': 0.15,
//   'avg7-foil': 0.29,
//   'avg30-foil': 0.33
// }
// -----------------
// {
//   idProduct: 1,
//   name: "Altar's Light",
//   idCategory: 1,
//   categoryName: 'Magic Single',
//   idExpansion: 45,
//   idMetacard: 129,
//   dateAdded: '2007-01-01 00:00:00'
// }
