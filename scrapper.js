import puppeteer from "puppeteer";
import fs from "fs";

// Fonction principale pour extraire les données
const getLorcana = async () => {
  // Lancement du navigateur Puppeteer
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  // Nouvelle page dans le navigateur
  const page = await browser.newPage();

  // URL de la première page à scraper
  const initialUrl = "https://www.cardmarket.com/fr/Lorcana/Products/Singles?idCategory=1629&idExpansion=0&idRarity=0&sortBy=price_desc&perSite=20";

  // Chargement de la première page
  await page.goto(initialUrl, {
    waitUntil: "domcontentloaded",
  });

  // Extraction des données de la première page
  let carList = await scrapePage(page);

  // Variables pour la pagination
  let nextPageExists = true;
  let currentPage = 2;

  // Boucle pour parcourir les pages suivantes tant qu'elles existent
  while (nextPageExists) {
    // URL de la page suivante
    const nextUrl = `https://www.cardmarket.com/fr/Lorcana/Products/Singles?idCategory=1629&idExpansion=0&idRarity=0&sortBy=price_desc&site=${currentPage}`;

    // Chargement de la page suivante
    await page.goto(nextUrl, { waitUntil: "domcontentloaded" });

    // Extraction des données de la page suivante
    const nextPageData = await scrapePage(page);

    // Vérification si la page suivante contient des données
    if (nextPageData.length > 0) {
      // Concaténation des données de la page suivante au tableau existant
      carList = carList.concat(nextPageData);
      currentPage++;
    } else {
      // Si la page suivante ne contient pas de données, arrêter la boucle
      nextPageExists = false;
    }
  }

  // Convertir le tableau d'objets en format JSON
  const jsonContent = JSON.stringify(carList, null, 4);

  // Écrire le contenu JSON dans un fichier
  fs.writeFileSync('cardList.json', jsonContent);

  // Fermer le navigateur une fois le traitement terminé
  // await browser.close();

  console.log(carList);

  console.log('Les données ont été enregistrées dans le fichier "cardList.json".');
};

// Fonction pour extraire les données d'une page
const scrapePage = async (page) => {
  return await page.evaluate(() => {
    // Sélection des éléments contenant les données des cartes
    const cardTable = document.querySelectorAll(
      "body > main > section > div.table.table-striped.mb-3 > div.table-body > div"
    );

    // Extraction des données de chaque carte
    return Array.from(cardTable).map((card) => {
      const cardName = (
        card.querySelector(
          "div:nth-child(4) > div > div.col-10.col-md-8.px-2.flex-column.align-items-start.justify-content-center > div > a"
        )
      )?.innerText;

      const cardPrice = (
        card.querySelector(".col-price.pe-sm-2")
      )?.innerText;

      const cardPriceFoil = (
        card.querySelector(
          "div.col-price.d-none.d-lg-flex.pe-lg-2"
        )
      )?.innerText;

      const cardRarity = (
        card.querySelector("div:nth-child(4) > div > div.col-sm-2.d-none.d-sm-flex.has-content-centered > div > span > span")
      )?.getAttribute("data-bs-original-title");

      const cardEdition = (
        card.querySelector(
          "div.col-icon.small > a"
        )
      )?.getAttribute("data-bs-original-title");


      const sourceImage = (
        card.querySelector(" div:nth-child(2) > span")
      )?.getAttribute("data-bs-original-title");

      const divElement = document.createElement('div');
      divElement.innerHTML = sourceImage;
      const imgElement = divElement.querySelector('img');
      const cardImgUrl = imgElement.src;

      const id = Math.round(Date.now() + Math.random() * 10000);

      // Retourner un objet représentant la carte
      return { id, cardName, cardPrice, cardPriceFoil, cardRarity, cardEdition, cardImgUrl };
    });
  });
};

// Appeler la fonction principale
getLorcana();
