// Länderprofile: Behörden, Währung, Kontonummern, Kennzeichen, Handynummern, Städte und Namen.
// Wird von den Fällen genutzt, damit ein Fall zum Land der Spielrunde passt – auf Deutsch und auf Englisch.
// Kernländer AT/DE/CH haben handverlesene fiktive Firmen (im Fall), alle anderen werden aus diesen Listen gewürfelt.

// ---------- Währungen ----------
// f = Umrechnungsfaktor für größere Beträge (Richtwert), lock = Schließfachpreise klein/mittel/groß, dec = Nachkommastellen
export const CUR = {
  EUR: { sym: "€", f: 1, lock: [3.5, 4.5, 6], dec: 2 },
  CHF: { sym: "CHF", f: 1, lock: [5, 7, 9], dec: 2 },
  GBP: { sym: "£", f: 0.85, lock: [3, 4, 5], dec: 2 },
  USD: { sym: "$", f: 1.1, lock: [4, 6, 8], dec: 2 },
  CAD: { sym: "CA$", f: 1.5, lock: [5, 7, 9], dec: 2 },
  AUD: { sym: "A$", f: 1.65, lock: [6, 8, 10], dec: 2 },
  NZD: { sym: "NZ$", f: 1.8, lock: [6, 8, 10], dec: 2 },
  DKK: { sym: "DKK", f: 7.5, lock: [30, 40, 50], dec: 2 },
  SEK: { sym: "SEK", f: 11, lock: [40, 50, 70], dec: 2 },
  NOK: { sym: "NOK", f: 11.5, lock: [40, 50, 70], dec: 2 },
  ISK: { sym: "ISK", f: 150, lock: [500, 700, 900], dec: 0 },
  PLN: { sym: "PLN", f: 4.3, lock: [15, 20, 25], dec: 2 },
  CZK: { sym: "CZK", f: 25, lock: [80, 100, 150], dec: 2 },
  HUF: { sym: "HUF", f: 400, lock: [1000, 1500, 2000], dec: 0 },
  RON: { sym: "RON", f: 5, lock: [15, 20, 30], dec: 2 },
  BGN: { sym: "BGN", f: 2, lock: [6, 8, 12], dec: 2 },
};
const SYMBOL_TIGHT = ["€", "£", "$", "CA$", "A$", "NZ$"];

// ---------- Länder ----------
// iban: [Länderkürzel, Gesamtlänge, Bankteil-Buchstaben?] · plate: Muster (L=Buchstabe, D=Ziffer, C=Stadtkürzel)
// mob: Muster der Handynummer (D = Ziffer) · cop: Nachname der Ermittlerin · city: [Ort, Park, englischer Name?, deutscher Name?]
const L = (s) => s.split(",").map((x) => x.trim());
export const COUNTRIES = {
  AT: { de: "Österreich", en: "Austria", cur: "EUR", iban: ["AT", 20], plate: "C-DDDLL", mob: "0664 DDD DDDD", suffix: "GmbH", schein: "e.U.", cop: "Brandl",
    codes: { wien: "W", vienna: "W", graz: "G", linz: "L", salzburg: "S", innsbruck: "I", klagenfurt: "K", "st. pölten": "P", "sankt pölten": "P", bregenz: "B", eisenstadt: "E", wels: "WE", villach: "VI", steyr: "SR", dornbirn: "DO", leoben: "LE", krems: "KS", "wiener neustadt": "WN", baden: "BN", feldkirch: "FK" },
    cities: [["Wien", "Stadtpark", "Vienna"], ["Graz", "Stadtpark"], ["Linz", "Donaupark"], ["Salzburg", "Mirabellgarten"], ["Innsbruck", "Hofgarten"], ["Klagenfurt", "Europapark"], ["St. Pölten", "Hammerpark"], ["Bregenz", "Seeanlagen"]],
    f: L("Anna, Julia, Lisa, Sarah, Katharina, Theresa, Sabine, Eva, Johanna, Verena, Miriam, Nina"), m: L("Lukas, Tobias, Florian, Stefan, Michael, Thomas, Markus, Daniel, Georg, Philipp, Jakob, Martin"),
    l: L("Gruber, Huber, Wagner, Pichler, Steiner, Moser, Mayer, Hofer, Leitner, Berger, Fuchs, Eder, Fischer, Schwarz, Winkler, Reiter, Brunner, Lang, Auer, Haas, Wimmer, Aigner") },
  DE: { de: "Deutschland", en: "Germany", cur: "EUR", iban: ["DE", 22], plate: "C-LL DDD", mob: "0151 DDD DDDD", suffix: "GmbH", schein: "e.K.", cop: "Brandl",
    codes: { berlin: "B", hamburg: "HH", münchen: "M", munich: "M", köln: "K", cologne: "K", "frankfurt am main": "F", frankfurt: "F", stuttgart: "S", düsseldorf: "D", leipzig: "L", hannover: "H", hanover: "H", nürnberg: "N", nuremberg: "N", dresden: "DD", bremen: "HB", essen: "E", dortmund: "DO", bonn: "BN", mannheim: "MA", augsburg: "A", freiburg: "FR", regensburg: "R", münster: "MS", kiel: "KI", mainz: "MZ", wiesbaden: "WI", karlsruhe: "KA" },
    cities: [["Berlin", "Tiergarten"], ["Hamburg", "Planten un Blomen"], ["München", "Englischer Garten", "Munich"], ["Köln", "Stadtwald", "Cologne"], ["Frankfurt am Main", "Grüneburgpark"], ["Stuttgart", "Schlossgarten"], ["Düsseldorf", "Hofgarten"], ["Leipzig", "Clara-Zetkin-Park"]],
    f: L("Anna, Laura, Julia, Katrin, Sabine, Nadine, Lea, Hannah, Jana, Miriam, Franziska, Svenja"), m: L("Jonas, Tim, Sebastian, Markus, Philipp, Jan, Tobias, Florian, Matthias, Lars, Dirk, Kevin"),
    l: L("Müller, Schmidt, Schneider, Fischer, Weber, Meyer, Wagner, Becker, Schulz, Hoffmann, Koch, Richter, Klein, Wolf, Neumann, Schwarz, Zimmermann, Krüger, Hartmann, Lange, Werner, Krause") },
  CH: { de: "Schweiz", en: "Switzerland", cur: "CHF", iban: ["CH", 21], plate: "C DDDDDD", mob: "079 DDD DD DD", suffix: "AG", schein: "GmbH", cop: "Brandl", noEszett: true,
    codes: { zürich: "ZH", zurich: "ZH", winterthur: "ZH", bern: "BE", berne: "BE", thun: "BE", biel: "BE", basel: "BS", luzern: "LU", lucerne: "LU", "st. gallen": "SG", "sankt gallen": "SG", zug: "ZG", chur: "GR", aarau: "AG", baden: "AG", schaffhausen: "SH", genf: "GE", geneva: "GE", lausanne: "VD", lugano: "TI", solothurn: "SO", frauenfeld: "TG", schwyz: "SZ", olten: "SO" },
    defaultCode: "ZH",
    cities: [["Zürich", "Zürichhorn", "Zurich"], ["Bern", "Rosengarten"], ["Basel", "Schützenmattpark"], ["Luzern", "Inseli", "Lucerne"], ["St. Gallen", "Stadtpark"], ["Zug", "Seeuferanlage"], ["Winterthur", "Rosengarten"], ["Thun", "Schadaupark"]],
    f: L("Sandra, Nadja, Corinne, Fabienne, Simone, Andrea, Seraina, Tamara, Nicole, Michelle, Jasmin, Regula"), m: L("Reto, Beat, Urs, Marco, Adrian, Patrick, Pascal, Lukas, Dominik, Raphael, Remo, Stefan"),
    l: L("Müller, Meier, Schmid, Keller, Weber, Huber, Schneider, Meyer, Steiner, Fischer, Gerber, Brunner, Baumann, Frei, Zimmermann, Moser, Widmer, Wyss, Graf, Roth, Kunz, Suter") },
  LI: { de: "Liechtenstein", en: "Liechtenstein", cur: "CHF", iban: ["LI", 21], plate: "FL DDDDD", mob: "078 DDD DD DD", suffix: "AG", schein: "Anstalt", cop: "Brandl", noEszett: true,
    cities: [["Vaduz", "Rheinpark"], ["Schaan", "Lindahof"], ["Triesen", "Dorfpark"], ["Balzers", "Burgpark"], ["Eschen", "Dorfpark"]],
    f: L("Sandra, Nadine, Andrea, Carmen, Julia, Sabrina, Martina, Petra, Stefanie, Monika, Daniela, Corina"), m: L("Thomas, Patrick, Marco, Stefan, Daniel, Michael, Christoph, Andreas, Roland, Mario, Markus, Peter"),
    l: L("Büchel, Frick, Marxer, Kaiser, Beck, Hasler, Wohlwend, Oehri, Kieber, Ospelt, Negele, Vogt, Gassner, Matt, Batliner, Risch, Schädler, Nigg, Biedermann, Meier") },
  IT: { de: "Italien", en: "Italy", cur: "EUR", iban: ["IT", 27, 1], plate: "LL DDD LL", mob: "3DD DDD DDDD", suffix: "S.p.A.", schein: "S.r.l.", cop: "Rinaldi",
    cities: [["Milano", "Parco Sempione", "Milan", "Mailand"], ["Roma", "Villa Borghese", "Rome", "Rom"], ["Torino", "Parco del Valentino", "Turin", "Turin"], ["Bologna", "Giardini Margherita"], ["Firenze", "Giardino di Boboli", "Florence", "Florenz"], ["Napoli", "Villa Comunale", "Naples", "Neapel"], ["Verona", "Giardino Giusti"], ["Genova", "Villetta Di Negro", "Genoa", "Genua"]],
    f: L("Giulia, Francesca, Chiara, Sara, Martina, Valentina, Elena, Federica, Alessia, Silvia, Laura, Paola"), m: L("Marco, Luca, Andrea, Matteo, Alessandro, Davide, Simone, Francesco, Stefano, Lorenzo, Giorgio, Paolo"),
    l: L("Rossi, Russo, Ferrari, Esposito, Bianchi, Romano, Colombo, Ricci, Marino, Greco, Bruno, Gallo, Conti, De Luca, Costa, Giordano, Mancini, Lombardi, Moretti, Barbieri, Fontana, Rinaldi") },
  FR: { de: "Frankreich", en: "France", cur: "EUR", iban: ["FR", 27], plate: "LL-DDD-LL", mob: "06 DD DD DD DD", suffix: "SA", schein: "SARL", cop: "Mercier",
    cities: [["Paris", "Jardin du Luxembourg"], ["Lyon", "Parc de la Tête d'Or"], ["Marseille", "Parc Borély"], ["Toulouse", "Jardin des Plantes"], ["Bordeaux", "Jardin Public"], ["Lille", "Parc de la Citadelle"], ["Nantes", "Jardin des Plantes"], ["Strasbourg", "Parc de l'Orangerie", "Strasbourg", "Straßburg"]],
    f: L("Camille, Léa, Chloé, Manon, Julie, Sophie, Claire, Émilie, Céline, Laure, Pauline, Inès"), m: L("Thomas, Nicolas, Julien, Maxime, Antoine, Pierre, Hugo, Lucas, Alexandre, Guillaume, Romain, Mathieu"),
    l: L("Martin, Bernard, Dubois, Thomas, Robert, Richard, Petit, Durand, Leroy, Moreau, Simon, Laurent, Lefebvre, Michel, Garcia, David, Bertrand, Roux, Vincent, Fournier, Girard, Mercier") },
  ES: { de: "Spanien", en: "Spain", cur: "EUR", iban: ["ES", 24], plate: "DDDD LLL", mob: "6DD DDD DDD", suffix: "S.A.", schein: "S.L.", cop: "Navarro",
    cities: [["Madrid", "Parque del Retiro"], ["Barcelona", "Parc de la Ciutadella"], ["Valencia", "Jardín del Turia"], ["Sevilla", "Parque de María Luisa", "Seville"], ["Bilbao", "Parque de Doña Casilda"], ["Málaga", "Parque de Málaga"], ["Zaragoza", "Parque Grande"], ["Palma", "Parc de la Mar"]],
    f: L("Lucía, María, Paula, Laura, Marta, Carmen, Elena, Sara, Ana, Cristina, Andrea, Irene"), m: L("Javier, Pablo, Alejandro, David, Daniel, Carlos, Miguel, Sergio, Álvaro, Jorge, Adrián, Raúl"),
    l: L("García, Fernández, González, Rodríguez, López, Martínez, Sánchez, Pérez, Gómez, Martín, Jiménez, Ruiz, Hernández, Díaz, Moreno, Álvarez, Romero, Alonso, Gutiérrez, Torres, Domínguez, Navarro") },
  PT: { de: "Portugal", en: "Portugal", cur: "EUR", iban: ["PT", 25], plate: "LL-DD-LL", mob: "91D DDD DDD", suffix: "S.A.", schein: "Lda.", cop: "Carvalho",
    cities: [["Lisboa", "Parque Eduardo VII", "Lisbon", "Lissabon"], ["Porto", "Jardins do Palácio de Cristal"], ["Braga", "Parque da Ponte"], ["Coimbra", "Jardim Botânico"], ["Faro", "Jardim Manuel Bivar"], ["Aveiro", "Parque Infante D. Pedro"], ["Setúbal", "Parque do Bonfim"], ["Funchal", "Jardim Municipal"]],
    f: L("Ana, Maria, Inês, Beatriz, Mariana, Joana, Sofia, Catarina, Rita, Marta, Carolina, Sara"), m: L("João, Pedro, Tiago, Miguel, Rui, Diogo, Nuno, Ricardo, André, Bruno, Gonçalo, Luís"),
    l: L("Silva, Santos, Ferreira, Pereira, Oliveira, Costa, Rodrigues, Martins, Jesus, Sousa, Fernandes, Gonçalves, Gomes, Lopes, Marques, Alves, Almeida, Ribeiro, Pinto, Teixeira, Moreira, Carvalho") },
  NL: { de: "Niederlande", en: "Netherlands", cur: "EUR", iban: ["NL", 18, 4], plate: "DD-LLL-D", mob: "06 DDDD DDDD", suffix: "B.V.", schein: "B.V.", cop: "de Graaf",
    cities: [["Amsterdam", "Vondelpark"], ["Rotterdam", "Het Park"], ["Utrecht", "Wilhelminapark"], ["Den Haag", "Haagse Bos", "The Hague", "Den Haag"], ["Eindhoven", "Stadswandelpark"], ["Groningen", "Noorderplantsoen"], ["Haarlem", "Haarlemmerhout"], ["Leiden", "Plantsoen"]],
    f: L("Emma, Sanne, Lotte, Anouk, Femke, Lisa, Eva, Sophie, Iris, Fleur, Marloes, Nienke"), m: L("Daan, Sem, Lucas, Thijs, Ruben, Bram, Jeroen, Niels, Joost, Bas, Koen, Wouter"),
    l: L("de Jong, Jansen, de Vries, van den Berg, van Dijk, Bakker, Janssen, Visser, Smit, Meijer, de Boer, Mulder, de Groot, Bos, Vos, Peters, Hendriks, van Leeuwen, Dekker, Brouwer, de Wit, de Graaf") },
  BE: { de: "Belgien", en: "Belgium", cur: "EUR", iban: ["BE", 16], plate: "D-LLL-DDD", mob: "047D DD DD DD", suffix: "NV", schein: "BV", cop: "Peeters",
    cities: [["Bruxelles", "Parc de Bruxelles", "Brussels", "Brüssel"], ["Antwerpen", "Stadspark", "Antwerp", "Antwerpen"], ["Gent", "Citadelpark", "Ghent", "Gent"], ["Brugge", "Koningin Astridpark", "Bruges", "Brügge"], ["Leuven", "Kruidtuin"], ["Liège", "Parc de la Boverie", "Liège", "Lüttich"], ["Namur", "Parc Louise-Marie"], ["Mechelen", "Vrijbroekpark"]],
    f: L("Laura, Sarah, Julie, Charlotte, Elise, Marie, Lotte, Nathalie, Sofie, Leen, Camille, Emma"), m: L("Thomas, Pieter, Jan, Wouter, Kevin, Maxime, Nicolas, Bart, Jens, Arnaud, Stijn, Tom"),
    l: L("Peeters, Janssens, Maes, Jacobs, Mertens, Willems, Claes, Goossens, Wouters, De Smet, Dubois, Lambert, Dupont, Martin, Hermans, Vermeulen, Van Damme, Leclercq, Michiels, Simon, Lemmens, Desmet") },
  LU: { de: "Luxemburg", en: "Luxembourg", cur: "EUR", iban: ["LU", 20], plate: "LL DDDD", mob: "621 DDD DDD", suffix: "S.A.", schein: "S.à r.l.", cop: "Weber",
    cities: [["Luxembourg", "Parc Municipal", "Luxembourg", "Luxemburg"], ["Esch-sur-Alzette", "Parc Laval"], ["Differdange", "Parc Gerlache"], ["Dudelange", "Parc Le'h"], ["Ettelbruck", "Parc Um Deich"]],
    f: L("Laura, Sarah, Anne, Claire, Julie, Lisa, Carole, Sophie, Mandy, Tessy, Michèle, Nathalie"), m: L("Luc, Marc, Paul, Tom, Yves, Jean, Pit, Gilles, Christophe, Ben, Serge, Claude"),
    l: L("Schmit, Muller, Weber, Wagner, Hoffmann, Thill, Schmitz, Klein, Kremer, Reuter, Becker, Kieffer, Schroeder, Majerus, Theis, Welter, Hansen, Faber, Weis, Scholtes, Meyer, Frisch") },
  IE: { de: "Irland", en: "Ireland", cur: "EUR", iban: ["IE", 22, 4], plate: "DDD-C-DDDD", mob: "087 DDD DDDD", suffix: "Ltd", schein: "Ltd", cop: "Doyle",
    codes: { dublin: "D", cork: "C", galway: "G", limerick: "L", waterford: "W", kilkenny: "KK", sligo: "SO", athlone: "WH" }, defaultCode: "D",
    cities: [["Dublin", "St Stephen's Green"], ["Cork", "Fitzgerald Park"], ["Galway", "Eyre Square"], ["Limerick", "People's Park"], ["Waterford", "People's Park"], ["Kilkenny", "Castle Park"], ["Sligo", "Doorly Park"], ["Athlone", "Burgess Park"]],
    f: L("Aoife, Sarah, Ciara, Niamh, Emma, Siobhán, Róisín, Orla, Laura, Sinéad, Clodagh, Grace"), m: L("Seán, Conor, Cian, Darragh, Liam, Patrick, Eoin, Ciarán, Niall, Shane, Declan, Kevin"),
    l: L("Murphy, Kelly, O'Sullivan, Walsh, Smith, O'Brien, Byrne, Ryan, O'Connor, O'Neill, O'Reilly, Doyle, McCarthy, Gallagher, Doherty, Kennedy, Lynch, Murray, Quinn, Moore, McLoughlin, Brennan") },
  GB: { de: "Vereinigtes Königreich", en: "United Kingdom", cur: "GBP", iban: ["GB", 22, 4], plate: "LLDD LLL", mob: "07DDD DDDDDD", suffix: "Ltd", schein: "Ltd", cop: "Hartley",
    cities: [["London", "Regent's Park", "London", "London"], ["Manchester", "Heaton Park"], ["Birmingham", "Cannon Hill Park"], ["Edinburgh", "Princes Street Gardens"], ["Glasgow", "Kelvingrove Park"], ["Leeds", "Roundhay Park"], ["Bristol", "Castle Park"], ["Liverpool", "Sefton Park"]],
    f: L("Emily, Sophie, Charlotte, Hannah, Olivia, Lucy, Amelia, Jessica, Rebecca, Chloe, Grace, Eleanor"), m: L("James, Oliver, Harry, George, Thomas, William, Jack, Daniel, Samuel, Matthew, Joseph, Edward"),
    l: L("Smith, Jones, Taylor, Brown, Williams, Wilson, Johnson, Davies, Robinson, Wright, Thompson, Evans, Walker, White, Roberts, Green, Hall, Wood, Jackson, Clarke, Hughes, Hartley") },
  DK: { de: "Dänemark", en: "Denmark", cur: "DKK", iban: ["DK", 18], plate: "LL DD DDD", mob: "2D DD DD DD", suffix: "A/S", schein: "ApS", cop: "Lindqvist",
    cities: [["Aarhus", "Botanisk Have"], ["København", "Kongens Have", "Copenhagen", "Kopenhagen"], ["Odense", "Munke Mose"], ["Aalborg", "Kildeparken"], ["Esbjerg", "Byparken"], ["Vejle", "Byparken"], ["Roskilde", "Byparken"], ["Horsens", "Caroline Amalie Lund"]],
    f: L("Sofie, Ida, Freja, Emma, Mette, Camilla, Line, Maria, Louise, Katrine, Anne, Julie"), m: L("Mikkel, Rasmus, Frederik, Mads, Jonas, Christian, Anders, Kasper, Søren, Jesper, Thomas, Martin"),
    l: L("Jensen, Nielsen, Hansen, Pedersen, Andersen, Christensen, Larsen, Sørensen, Rasmussen, Jørgensen, Petersen, Madsen, Kristensen, Olsen, Thomsen, Christiansen, Poulsen, Johansen, Møller, Mortensen, Lund, Holm") },
  SE: { de: "Schweden", en: "Sweden", cur: "SEK", iban: ["SE", 24], plate: "LLL DDD", mob: "070-DDD DD DD", suffix: "AB", schein: "AB", cop: "Lindqvist",
    cities: [["Stockholm", "Kungsträdgården"], ["Göteborg", "Slottsskogen", "Gothenburg", "Göteborg"], ["Malmö", "Slottsparken"], ["Uppsala", "Stadsträdgården"], ["Västerås", "Vasaparken"], ["Örebro", "Stadsparken"], ["Linköping", "Trädgårdsföreningen"], ["Lund", "Stadsparken"]],
    f: L("Emma, Maja, Elsa, Linnea, Sara, Anna, Johanna, Karin, Frida, Ida, Sofia, Malin"), m: L("Erik, Oscar, Johan, Anders, Lars, Magnus, Fredrik, Henrik, Mattias, Jonas, Gustav, Axel"),
    l: L("Andersson, Johansson, Karlsson, Nilsson, Eriksson, Larsson, Olsson, Persson, Svensson, Gustafsson, Pettersson, Jonsson, Jansson, Hansson, Bengtsson, Jönsson, Lindberg, Jakobsson, Magnusson, Lindström, Berg, Lindqvist") },
  NO: { de: "Norwegen", en: "Norway", cur: "NOK", iban: ["NO", 15], plate: "LL DDDDD", mob: "4DD DD DDD", suffix: "AS", schein: "AS", cop: "Haugland",
    cities: [["Oslo", "Frognerparken"], ["Bergen", "Byparken"], ["Trondheim", "Marinen"], ["Stavanger", "Byparken"], ["Tromsø", "Prestvannet"], ["Drammen", "Bragernes torg"], ["Kristiansand", "Ravnedalen"], ["Ålesund", "Byparken"]],
    f: L("Nora, Ingrid, Emma, Sara, Ida, Kristine, Marte, Silje, Hanne, Ingvild, Tone, Kari"), m: L("Jakob, Emil, Henrik, Kristian, Magnus, Ola, Lars, Sindre, Anders, Espen, Thomas, Eirik"),
    l: L("Hansen, Johansen, Olsen, Larsen, Andersen, Pedersen, Nilsen, Kristiansen, Jensen, Karlsen, Johnsen, Pettersen, Eriksen, Berg, Haugen, Hagen, Johannessen, Andreassen, Jacobsen, Dahl, Lie, Haugland") },
  FI: { de: "Finnland", en: "Finland", cur: "EUR", iban: ["FI", 18], plate: "LLL-DDD", mob: "040 DDD DDDD", suffix: "Oyj", schein: "Oy", cop: "Virtanen",
    cities: [["Helsinki", "Esplanadi"], ["Tampere", "Näsinpuisto"], ["Turku", "Samppalinnanmäki"], ["Oulu", "Hupisaaret"], ["Espoo", "Tapiola Park"], ["Jyväskylä", "Harjupuisto"], ["Kuopio", "Väinölänniemi"], ["Lahti", "Pikku-Vesijärvenpuisto"]],
    f: L("Aino, Emilia, Sofia, Laura, Johanna, Anna, Sanna, Maria, Elina, Katja, Noora, Riikka"), m: L("Mikko, Juha, Antti, Matti, Ville, Janne, Lauri, Timo, Jari, Sami, Petri, Eero"),
    l: L("Korhonen, Nieminen, Mäkinen, Mäkelä, Hämäläinen, Koskinen, Heikkinen, Järvinen, Lehtonen, Lehtinen, Saarinen, Salminen, Heinonen, Niemi, Heikkilä, Kinnunen, Salonen, Turunen, Salo, Laine, Rantanen, Virtanen") },
  IS: { de: "Island", en: "Iceland", cur: "ISK", iban: ["IS", 26], plate: "LL DDD", mob: "6DD DDDD", suffix: "hf.", schein: "ehf.", cop: "Einarsdóttir",
    cities: [["Reykjavík", "Hljómskálagarður"], ["Akureyri", "Lystigarðurinn"], ["Kópavogur", "Rútstún"], ["Hafnarfjörður", "Hellisgerði"], ["Reykjanesbær", "Skrúðgarður"]],
    f: L("Guðrún, Anna, Kristín, Sigríður, Helga, Margrét, Katrín, Sara, Eva, Hildur, Ásta, Ragnheiður"), m: L("Jón, Sigurður, Guðmundur, Gunnar, Ólafur, Einar, Kristján, Magnús, Stefán, Björn, Ragnar, Arnar"),
    l: L("Jónsson, Sigurðsson, Guðmundsson, Gunnarsson, Ólafsson, Einarsson, Kristjánsson, Magnússon, Stefánsson, Björnsson, Jónsdóttir, Sigurðardóttir, Guðmundsdóttir, Gunnarsdóttir, Ólafsdóttir, Einarsdóttir, Kristjánsdóttir, Magnúsdóttir, Stefánsdóttir, Björnsdóttir, Árnason, Pálsdóttir"), patronymic: true },
  PL: { de: "Polen", en: "Poland", cur: "PLN", iban: ["PL", 28], plate: "C DDDDD", mob: "5DD DDD DDD", suffix: "S.A.", schein: "sp. z o.o.", cop: "Nowak",
    codes: { warszawa: "WX", warsaw: "WX", kraków: "KR", krakow: "KR", wrocław: "DW", wroclaw: "DW", poznań: "PO", poznan: "PO", gdańsk: "GD", gdansk: "GD", łódź: "EL", lodz: "EL", katowice: "SK", lublin: "LU" }, defaultCode: "WX",
    cities: [["Warszawa", "Łazienki Królewskie", "Warsaw", "Warschau"], ["Kraków", "Planty", "Krakow", "Krakau"], ["Wrocław", "Park Szczytnicki", "Wroclaw"], ["Poznań", "Park Cytadela", "Poznan"], ["Gdańsk", "Park Oliwski", "Gdansk"], ["Łódź", "Park Źródliska", "Lodz"], ["Katowice", "Park Śląski"], ["Lublin", "Ogród Saski"]],
    f: L("Anna, Katarzyna, Magdalena, Agnieszka, Joanna, Aleksandra, Monika, Karolina, Natalia, Paulina, Ewa, Marta"), m: L("Piotr, Tomasz, Paweł, Michał, Krzysztof, Marcin, Łukasz, Jakub, Kamil, Adam, Bartosz, Mateusz"),
    l: L("Kowalski, Wiśniewski, Wójcik, Kowalczyk, Kamiński, Lewandowski, Zieliński, Szymański, Woźniak, Dąbrowski, Kozłowski, Jankowski, Mazur, Kwiatkowski, Krawczyk, Piotrowski, Grabowski, Pawłowski, Michalski, Król, Wieczorek, Nowak"), femaleSuffix: true },
  CZ: { de: "Tschechien", en: "Czechia", cur: "CZK", iban: ["CZ", 24], plate: "DLD DDDD", mob: "6DD DDD DDD", suffix: "a.s.", schein: "s.r.o.", cop: "Dvořáková",
    cities: [["Praha", "Letná", "Prague", "Prag"], ["Brno", "Lužánky"], ["Ostrava", "Komenského sady"], ["Plzeň", "Křižíkovy sady", "Pilsen", "Pilsen"], ["Liberec", "Lidové sady"], ["Olomouc", "Smetanovy sady"], ["České Budějovice", "Sady"], ["Hradec Králové", "Jiráskovy sady"]],
    f: L("Jana, Petra, Lucie, Tereza, Kateřina, Eva, Veronika, Martina, Michaela, Barbora, Hana, Lenka"), m: L("Jan, Petr, Tomáš, Martin, Jakub, Lukáš, Ondřej, David, Pavel, Michal, Jiří, Vojtěch"),
    l: L("Novák, Svoboda, Novotný, Dvořák, Černý, Procházka, Kučera, Veselý, Horák, Němec, Marek, Pospíšil, Pokorný, Hájek, Král, Jelínek, Růžička, Beneš, Fiala, Sedláček, Doležal, Zeman"), femaleSuffix: true },
  SK: { de: "Slowakei", en: "Slovakia", cur: "EUR", iban: ["SK", 24], plate: "C-DDDLL", mob: "09DD DDD DDD", suffix: "a.s.", schein: "s.r.o.", cop: "Horváthová",
    codes: { bratislava: "BA", košice: "KE", kosice: "KE", žilina: "ZA", zilina: "ZA", "banská bystrica": "BB", nitra: "NR", prešov: "PO", presov: "PO", trnava: "TT", trenčín: "TN" }, defaultCode: "BA",
    cities: [["Bratislava", "Sad Janka Kráľa"], ["Košice", "Mestský park", "Kosice"], ["Žilina", "Sad SNP"], ["Banská Bystrica", "Mestský park"], ["Nitra", "Sad Janka Kráľa"], ["Prešov", "Mestský park"], ["Trnava", "Kamenný mlyn"], ["Trenčín", "Mestský park"]],
    f: L("Zuzana, Katarína, Lucia, Martina, Jana, Monika, Veronika, Simona, Petra, Eva, Andrea, Ivana"), m: L("Peter, Martin, Tomáš, Michal, Marek, Juraj, Lukáš, Ján, Matej, Jakub, Dávid, Milan"),
    l: L("Horváth, Kováč, Varga, Tóth, Nagy, Baláž, Szabó, Molnár, Balog, Lukáč, Novák, Kováčik, Polák, Hudák, Kollár, Oravec, Marek, Kráľ, Švec, Šimko, Kučera, Blaho"), femaleSuffix: true },
  HU: { de: "Ungarn", en: "Hungary", cur: "HUF", iban: ["HU", 28], plate: "LLL-DDD", mob: "+36 30 DDD DDDD", suffix: "Zrt.", schein: "Kft.", cop: "Szabó",
    cities: [["Budapest", "Városliget"], ["Debrecen", "Nagyerdő"], ["Szeged", "Széchenyi tér"], ["Pécs", "Tettye"], ["Győr", "Radó-sziget"], ["Miskolc", "Népkert"], ["Székesfehérvár", "Zichy liget"], ["Sopron", "Erzsébet-kert"]],
    f: L("Anna, Eszter, Zsófia, Katalin, Réka, Dóra, Petra, Viktória, Krisztina, Judit, Nóra, Orsolya"), m: L("Bence, Máté, Dávid, Gábor, Péter, László, Zoltán, Tamás, András, Balázs, Ádám, Attila"),
    l: L("Nagy, Kovács, Tóth, Szabó, Horváth, Varga, Kiss, Molnár, Németh, Farkas, Balogh, Papp, Takács, Juhász, Lakatos, Mészáros, Oláh, Simon, Rácz, Fekete, Szilágyi, Török") },
  SI: { de: "Slowenien", en: "Slovenia", cur: "EUR", iban: ["SI", 19], plate: "C LL-DDD", mob: "04D DDD DDD", suffix: "d.d.", schein: "d.o.o.", cop: "Novak",
    codes: { ljubljana: "LJ", maribor: "MB", celje: "CE", kranj: "KR", koper: "KP", "novo mesto": "NM" }, defaultCode: "LJ",
    cities: [["Ljubljana", "Tivoli", "Ljubljana"], ["Maribor", "Mestni park", "Maribor"], ["Celje", "Mestni park"], ["Kranj", "Layerjev park"], ["Koper", "Tito-Platz"], ["Novo mesto", "Loka"]],
    f: L("Maja, Nina, Eva, Ana, Petra, Katja, Tina, Urška, Mojca, Sara, Nika, Špela"), m: L("Luka, Matej, Jan, Nejc, Žiga, Rok, Gregor, Tomaž, Andrej, Miha, Aleš, Blaž"),
    l: L("Novak, Horvat, Kovačič, Krajnc, Zupančič, Potočnik, Kovač, Mlakar, Kos, Vidmar, Golob, Turk, Kralj, Zupan, Bizjak, Hribar, Korošec, Rozman, Kotnik, Oblak, Petek, Kastelic") },
  HR: { de: "Kroatien", en: "Croatia", cur: "EUR", iban: ["HR", 21], plate: "C DDDD-LL", mob: "09D DDD DDDD", suffix: "d.d.", schein: "d.o.o.", cop: "Horvat",
    codes: { zagreb: "ZG", split: "ST", rijeka: "RI", osijek: "OS", zadar: "ZD", pula: "PU", dubrovnik: "DU", varaždin: "VŽ" }, defaultCode: "ZG",
    cities: [["Zagreb", "Maksimir"], ["Split", "Marjan"], ["Rijeka", "Park Nikole Hosta"], ["Osijek", "Perivoj kralja Tomislava"], ["Zadar", "Perivoj Vladimira Nazora"], ["Pula", "Park Monte Zaro"], ["Dubrovnik", "Gradac"], ["Varaždin", "Gradski park"]],
    f: L("Ana, Ivana, Petra, Marija, Maja, Lucija, Martina, Katarina, Kristina, Iva, Mateja, Tea"), m: L("Ivan, Marko, Luka, Josip, Tomislav, Ante, Matej, Filip, Petar, Nikola, Mario, Dario"),
    l: L("Horvat, Kovačević, Babić, Marić, Jurić, Novak, Kovačić, Knežević, Vuković, Marković, Petrović, Matić, Tomić, Pavlović, Kovač, Božić, Blažević, Grgić, Pavić, Radić, Perić, Šarić") },
  RO: { de: "Rumänien", en: "Romania", cur: "RON", iban: ["RO", 24, 4], plate: "C DDD LLL", mob: "07DD DDD DDD", suffix: "S.A.", schein: "SRL", cop: "Popescu",
    codes: { bucurești: "B", bucuresti: "B", bucharest: "B", "cluj-napoca": "CJ", cluj: "CJ", timișoara: "TM", timisoara: "TM", iași: "IS", iasi: "IS", constanța: "CT", constanta: "CT", brașov: "BV", brasov: "BV", sibiu: "SB", oradea: "BH" }, defaultCode: "B",
    cities: [["București", "Parcul Herăstrău", "Bucharest", "Bukarest"], ["Cluj-Napoca", "Parcul Central"], ["Timișoara", "Parcul Rozelor"], ["Iași", "Grădina Copou"], ["Brașov", "Parcul Central", "Brasov"], ["Sibiu", "Parcul Sub Arini", "Sibiu"], ["Constanța", "Parcul Tăbăcărie"], ["Oradea", "Parcul 1 Decembrie"]],
    f: L("Andreea, Ioana, Maria, Elena, Alexandra, Cristina, Diana, Raluca, Mihaela, Ana, Bianca, Irina"), m: L("Andrei, Alexandru, Mihai, Ionuț, Bogdan, Cristian, Adrian, Vlad, Stefan, Radu, Florin, Gabriel"),
    l: L("Popa, Popescu, Pop, Radu, Dumitru, Stan, Stoica, Gheorghe, Matei, Ciobanu, Ionescu, Rusu, Munteanu, Constantin, Marin, Mihai, Florea, Tudor, Dinu, Barbu, Lungu, Neagu") },
  BG: { de: "Bulgarien", en: "Bulgaria", cur: "BGN", iban: ["BG", 22, 4], plate: "C DDDD LL", mob: "08D DDD DDDD", suffix: "AD", schein: "EOOD", cop: "Petrova",
    codes: { sofia: "CA", sofija: "CA", plovdiv: "PB", varna: "B", burgas: "A", ruse: "P", "stara zagora": "CT", pleven: "EH" }, defaultCode: "CA",
    cities: [["Sofia", "Borisova Gradina"], ["Plovdiv", "Tsar Simeon Garden"], ["Varna", "Sea Garden"], ["Burgas", "Sea Garden"], ["Ruse", "Park na Mladezhta"], ["Stara Zagora", "Ayazmoto"]],
    f: L("Maria, Ivana, Elena, Desislava, Gergana, Viktoria, Yana, Teodora, Nikol, Radostina, Silvia, Petya"), m: L("Georgi, Ivan, Dimitar, Nikolay, Petar, Hristo, Stoyan, Martin, Aleksandar, Kaloyan, Todor, Vasil"),
    l: L("Ivanov, Georgiev, Dimitrov, Petrov, Nikolov, Hristov, Stoyanov, Todorov, Iliev, Vasilev, Atanasov, Angelov, Petkov, Marinov, Kolev, Yordanov, Popov, Stefanov, Mihaylov, Kostov, Nedelchev, Tsvetkov"), femaleA: true },
  GR: { de: "Griechenland", en: "Greece", cur: "EUR", iban: ["GR", 27], plate: "LLL-DDDD", mob: "69D DDD DDDD", suffix: "S.A.", schein: "IKE", cop: "Papadaki",
    cities: [["Athína", "Ethnikos Kipos", "Athens", "Athen"], ["Thessaloníki", "Pedion tou Areos", "Thessaloniki", "Thessaloniki"], ["Pátra", "Plateia Georgiou", "Patras", "Patras"], ["Irákleio", "Theotokopoulos Park", "Heraklion", "Heraklion"], ["Lárisa", "Alkazar Park", "Larissa", "Larisa"], ["Vólos", "Anavros Park", "Volos", "Volos"]],
    f: L("Maria, Eleni, Katerina, Sofia, Dimitra, Georgia, Anna, Ioanna, Christina, Vasiliki, Despina, Eirini"), m: L("Giorgos, Dimitris, Nikos, Kostas, Giannis, Christos, Panagiotis, Vasilis, Alexandros, Michalis, Stavros, Thanasis"),
    l: L("Papadopoulos, Papadakis, Georgiou, Nikolaou, Dimitriou, Konstantinou, Ioannou, Vasileiou, Christodoulou, Athanasiou, Pappas, Oikonomou, Makris, Antoniou, Karagiannis, Alexiou, Stavrou, Economou, Theodorou, Kyriakou, Lambrou, Mavridis"), femaleGreek: true },
  EE: { de: "Estland", en: "Estonia", cur: "EUR", iban: ["EE", 20], plate: "DDD LLL", mob: "5DDD DDDD", suffix: "AS", schein: "OÜ", cop: "Tamm",
    cities: [["Tallinn", "Kadriorg"], ["Tartu", "Toomemägi"], ["Pärnu", "Rannapark"], ["Narva", "Kreenholm Park"], ["Viljandi", "Lossimäed"]],
    f: L("Kadri, Liis, Mari, Kristiina, Triin, Kati, Anu, Piret, Laura, Maria, Eliis, Helen"), m: L("Martin, Andres, Rasmus, Kristjan, Mihkel, Tanel, Priit, Jaan, Siim, Marko, Taavi, Indrek"),
    l: L("Tamm, Saar, Sepp, Mägi, Kask, Kukk, Rebane, Ilves, Pärn, Koppel, Karu, Lepik, Kallas, Raudsepp, Kuusk, Vaher, Oja, Lepp, Luik, Kaasik, Kivi, Mets") },
  LV: { de: "Lettland", en: "Latvia", cur: "EUR", iban: ["LV", 21, 4], plate: "LL-DDDD", mob: "2DDD DDDD", suffix: "AS", schein: "SIA", cop: "Bērziņa",
    cities: [["Rīga", "Vērmanes dārzs", "Riga", "Riga"], ["Daugavpils", "Dubrovina parks"], ["Liepāja", "Jūrmalas parks"], ["Jelgava", "Pils parks"], ["Ventspils", "Piejūras parks"]],
    f: L("Anna, Līga, Inese, Kristīne, Ilze, Laura, Elīna, Sanita, Dace, Zane, Madara, Agnese"), m: L("Jānis, Andris, Mārtiņš, Kristaps, Edgars, Artūrs, Roberts, Aigars, Kārlis, Raimonds, Juris, Pēteris"),
    l: L("Bērziņš, Kalniņš, Ozoliņš, Jansons, Ozols, Liepiņš, Krūmiņš, Balodis, Eglītis, Zariņš, Pētersons, Vītols, Kļaviņš, Kārkliņš, Vanags, Lācis, Siliņš, Sproģis, Priede, Āboliņš, Grīnbergs, Kalējs"), femaleLatvian: true },
  LT: { de: "Litauen", en: "Lithuania", cur: "EUR", iban: ["LT", 20], plate: "LLL DDD", mob: "+370 6DD DDDDD", suffix: "AB", schein: "UAB", cop: "Kazlauskienė",
    cities: [["Vilnius", "Bernardinų sodas", "Vilnius"], ["Kaunas", "Ąžuolynas"], ["Klaipėda", "Skulptūrų parkas", "Klaipeda"], ["Šiauliai", "Talšos parkas"], ["Panevėžys", "Senvagės parkas"]],
    f: L("Rūta, Eglė, Ieva, Greta, Gabija, Lina, Aistė, Monika, Kristina, Justina, Indrė, Vaida"), m: L("Tomas, Mantas, Lukas, Jonas, Paulius, Darius, Andrius, Mindaugas, Karolis, Vytautas, Rokas, Marius"),
    l: L("Kazlauskas, Jankauskas, Petrauskas, Stankevičius, Vasiliauskas, Žukauskas, Butkus, Paulauskas, Urbonas, Kavaliauskas, Baranauskas, Pocius, Navickas, Sakalauskas, Rimkus, Adomaitis, Lukoševičius, Mockus, Vaitkus, Balčiūnas, Ramanauskas, Jonaitis"), femaleLithuanian: true },
  MT: { de: "Malta", en: "Malta", cur: "EUR", iban: ["MT", 31, 4], plate: "LLL DDD", mob: "79DD DDDD", suffix: "plc", schein: "Ltd", cop: "Borg",
    cities: [["Valletta", "Upper Barrakka Gardens"], ["Sliema", "Independence Garden"], ["Birkirkara", "Wied Għajn Riħana"], ["Mosta", "Ta' Qali"], ["St. Julian's", "Spinola Park"]],
    f: L("Maria, Sarah, Rebecca, Nicole, Martina, Stephanie, Claire, Joanna, Rachel, Elaine, Francesca, Kirsten"), m: L("Joseph, Mark, John, Paul, Matthew, David, Luke, Jean, Karl, Christian, Andrew, Daniel"),
    l: L("Borg, Camilleri, Vella, Farrugia, Zammit, Galea, Micallef, Grech, Attard, Spiteri, Azzopardi, Mifsud, Agius, Pace, Cassar, Sammut, Fenech, Caruana, Debono, Muscat, Abela, Bonello") },
  CY: { de: "Zypern", en: "Cyprus", cur: "EUR", iban: ["CY", 28], plate: "LLL DDD", mob: "99 DDD DDD", suffix: "Ltd", schein: "Ltd", cop: "Georgiou",
    cities: [["Lefkosia", "Municipal Gardens", "Nicosia", "Nikosia"], ["Lemesos", "Municipal Garden", "Limassol", "Limassol"], ["Larnaka", "Municipal Garden", "Larnaca", "Larnaka"], ["Pafos", "Kennedy Square", "Paphos", "Paphos"], ["Ammochostos", "Protaras Park", "Famagusta", "Famagusta"]],
    f: L("Maria, Eleni, Andrea, Christina, Anna, Georgia, Stella, Katerina, Marina, Despo, Chrystalla, Natalia"), m: L("Andreas, Christos, Georgios, Nikolas, Michalis, Kyriakos, Marios, Panayiotis, Charalambos, Antonis, Stelios, Loizos"),
    l: L("Georgiou, Charalambous, Constantinou, Christodoulou, Nicolaou, Ioannou, Andreou, Michael, Demetriou, Savva, Panayiotou, Kyriacou, Hadjipetrou, Pavlou, Theodorou, Antoniou, Loizou, Stylianou, Neophytou, Christou, Vasiliou, Efstathiou") },
  US: { de: "USA", en: "United States", cur: "USD", bank: "US", plate: "DLLLDDD", mob: "(DDD) DDD-DDDD", suffix: "Inc.", schein: "LLC", cop: "Delgado", us: true,
    cities: [["New York", "Central Park"], ["Chicago", "Grant Park"], ["Boston", "Boston Common"], ["San Francisco", "Golden Gate Park"], ["Seattle", "Volunteer Park"], ["Austin", "Zilker Park"], ["Denver", "City Park"], ["Atlanta", "Piedmont Park"]],
    f: L("Emily, Jessica, Ashley, Sarah, Megan, Lauren, Rachel, Hannah, Olivia, Madison, Nicole, Amanda"), m: L("Michael, Christopher, Matthew, Joshua, Andrew, Ryan, Tyler, Brandon, Justin, Kevin, Daniel, Jason"),
    l: L("Smith, Johnson, Williams, Brown, Jones, Miller, Davis, Garcia, Rodriguez, Wilson, Martinez, Anderson, Taylor, Thomas, Moore, Jackson, Martin, Lee, Thompson, White, Harris, Delgado") },
  CA: { de: "Kanada", en: "Canada", cur: "CAD", bank: "CA", plate: "LLLL DDD", mob: "(DDD) DDD-DDDD", suffix: "Inc.", schein: "Inc.", cop: "Tremblay",
    cities: [["Toronto", "High Park"], ["Vancouver", "Stanley Park"], ["Montréal", "Parc du Mont-Royal", "Montreal", "Montreal"], ["Calgary", "Prince's Island Park"], ["Ottawa", "Major's Hill Park"], ["Edmonton", "Hawrelak Park"], ["Winnipeg", "Assiniboine Park"], ["Halifax", "Point Pleasant Park"]],
    f: L("Emma, Olivia, Sarah, Jessica, Emily, Chloe, Megan, Julie, Amanda, Mélanie, Rachel, Stephanie"), m: L("Liam, Ethan, Noah, Nathan, Alexandre, Ryan, Matthew, Justin, Kevin, Mathieu, Jordan, Tyler"),
    l: L("Smith, Brown, Tremblay, Martin, Roy, Wilson, MacDonald, Gagnon, Johnson, Taylor, Côté, Campbell, Anderson, Leblanc, Lee, Jones, White, Williams, Miller, Thompson, Gauthier, Young") },
  AU: { de: "Australien", en: "Australia", cur: "AUD", bank: "AU", plate: "LLL-DDD", mob: "04DD DDD DDD", suffix: "Pty Ltd", schein: "Pty Ltd", cop: "Mitchell",
    cities: [["Sydney", "Hyde Park"], ["Melbourne", "Fitzroy Gardens"], ["Brisbane", "Roma Street Parkland"], ["Perth", "Kings Park"], ["Adelaide", "Botanic Garden"], ["Canberra", "Commonwealth Park"], ["Hobart", "St David's Park"], ["Gold Coast", "Broadwater Parklands"]],
    f: L("Charlotte, Olivia, Chloe, Emily, Jessica, Sophie, Hannah, Georgia, Lauren, Kate, Bianca, Amelia"), m: L("Jack, Lachlan, Oliver, William, Thomas, James, Joshua, Liam, Cooper, Harrison, Daniel, Ryan"),
    l: L("Smith, Jones, Williams, Brown, Wilson, Taylor, Johnson, White, Martin, Anderson, Thompson, Nguyen, Thomas, Walker, Harris, Lee, Ryan, Robinson, Kelly, King, Campbell, Mitchell") },
  NZ: { de: "Neuseeland", en: "New Zealand", cur: "NZD", bank: "NZ", plate: "LLLDDD", mob: "021 DDD DDDD", suffix: "Ltd", schein: "Ltd", cop: "Ngata",
    cities: [["Auckland", "Auckland Domain"], ["Wellington", "Botanic Garden"], ["Christchurch", "Hagley Park"], ["Hamilton", "Hamilton Gardens"], ["Dunedin", "Botanic Garden"], ["Tauranga", "Memorial Park"]],
    f: L("Charlotte, Olivia, Isla, Emily, Sophie, Grace, Hannah, Ruby, Kate, Aroha, Mia, Georgia"), m: L("Oliver, Jack, William, James, Thomas, Liam, Samuel, Benjamin, Nikau, Hamish, Lucas, Ethan"),
    l: L("Smith, Wilson, Williams, Brown, Taylor, Jones, Singh, Anderson, Thompson, Walker, Campbell, Martin, Clark, White, Young, Robinson, Harris, King, Scott, Parata, Tane, Ngata") },
  XX: { de: "Anderes Land (fiktiver Ort)", en: "Other country (fictional place)", cur: "EUR", bank: "XX", plate: "LL DDDD", mob: "+99 DDD DDD DDD", suffix: "Group", schein: "Ltd", cop: "Novak", fictional: true,
    cities: [["Port Avalon", "Harbour Park"], ["Northbridge", "Riverside Park"], ["Lakeshore", "Lakeside Gardens"], ["Silverton", "Crown Park"], ["Eastwick", "Old Mill Park"], ["Westbury", "Linden Park"], ["Kingsport", "Lighthouse Park"], ["Meridian", "Central Gardens"]],
    f: L("Anna, Maria, Laura, Sofia, Elena, Nina, Clara, Julia, Mia, Sara, Olivia, Emma"), m: L("David, Daniel, Lucas, Leo, Adam, Martin, Thomas, Samuel, Max, Jonas, Victor, Oscar"),
    l: L("Novak, Silva, Berg, Hansen, Moreau, Rossi, Weber, Kowalski, Jansen, Costa, Lindberg, Petrov, Horvat, Meyer, Andersen, Nagy, Laurent, Fischer, Morales, Bianchi, Olsen, Duarte") },
};
export const COUNTRY_ORDER = ["AT", "DE", "CH", "LI", "IT", "FR", "ES", "PT", "NL", "BE", "LU", "IE", "GB", "DK", "SE", "NO", "FI", "IS", "PL", "CZ", "SK", "HU", "SI", "HR", "RO", "BG", "GR", "EE", "LV", "LT", "MT", "CY", "US", "CA", "AU", "NZ", "XX"];
export const countryOf = (code) => (COUNTRIES[code] ? code : "AT");
export const GERMAN_SPEAKING = ["AT", "DE", "CH", "LI"];

// ---------- Behörden, Zeitung & Co. je Land und Spielsprache ----------
export function localize(code, lang, city) {
  const k = COUNTRIES[countryOf(code)];
  const en = lang === "en";
  const de = GERMAN_SPEAKING.includes(code);
  const c = city || "";
  if (en) {
    const pol = { AT: ["State Criminal Police", "Chief Inspector", `State Criminal Police ${c}`],
      DE: ["Criminal Police", "Detective Chief Inspector", `Criminal Police ${c}`],
      GB: ["Criminal Investigation Department", "Detective Inspector", `${c} CID`],
      IE: ["Garda Detective Unit", "Detective Inspector", `Garda Síochána, ${c}`],
      US: ["Police Department · Detective Bureau", "Detective Lieutenant", `${c} Police Department`],
      CA: ["Police Service · Major Crime", "Detective Sergeant", `${c} Police Service`],
      AU: ["Police · Major Crime Squad", "Detective Inspector", `${c} Police`],
      NZ: ["Police · Criminal Investigation Branch", "Detective Inspector", `New Zealand Police, ${c}`] }[code]
      || ["Criminal Investigation Unit", "Detective Inspector", `${c} Police`];
    const paper = { AT: "The Melange", DE: "The Evening Courier", CH: "The City Gazette", LI: "The City Gazette", US: `The ${c} Herald` }[code] || `The ${c} Evening Post`;
    return { behoerde: pol[0], ermittlerin: pol[1], behoerde_ort: pol[2], zeitung: paper, polizeistelle: code === "IE" ? "Garda station" : "police station",
      polizei: code === "IE" ? "Garda" : "Police", polizei_news: code === "IE" ? "Gardaí" : "Police",
      register: "company register", stiege: "Stairwell", taxi: `${c} Cabs`, hbf: HBF_EN[c] || (code === "US" || code === "CA" ? "Union Station" : "Central Station") };
  }
  const pol = { AT: ["Landeskriminalamt", "Chefinspektorin"], DE: ["Kriminalpolizei", "Kriminalhauptkommissarin"], LI: ["Landespolizei", "Kommissarin"] }[code] || ["Kriminalpolizei", "Kommissarin"];
  const paper = { AT: "Die Melange", DE: "Der Abendbote", CH: "Der Stadtanzeiger", LI: "Der Stadtanzeiger" }[code] || `Abendblatt ${c}`;
  return { behoerde: pol[0], ermittlerin: pol[1], behoerde_ort: `${pol[0]} ${c}`, zeitung: paper,
    polizeistelle: { AT: "jede Polizeiinspektion", CH: "jeder Polizeiposten", LI: "jeder Polizeiposten" }[code] || "jede Polizeidienststelle",
    register: code === "AT" ? "Firmenbuch" : "Handelsregister", stiege: code === "AT" ? "Stiegenhaus" : "Treppenhaus", taxi: `Funktaxi ${c}`, hbf: "Hauptbahnhof", de };
}
export const scheinfirma = (code) => `${GERMAN_SPEAKING.includes(code) ? "Consulting Nord" : "North Star Consulting"} ${COUNTRIES[countryOf(code)].schein}`;
export const investigator = (code) => `M. ${COUNTRIES[countryOf(code)].cop}`;

// ---------- Geld ----------
export function money(code, lang, n, cents = false) {
  const cur = CUR[COUNTRIES[countryOf(code)].cur];
  const dec = cents && cur.dec ? cur.dec : 0;
  const [i, d] = Number(n).toFixed(dec).split(".");
  const grp = (sep) => i.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  if (cur.sym === "CHF") return lang === "en" ? `CHF ${grp(",")}${d ? "." + d : ""}` : `CHF ${grp("’")}${d ? "." + d : ""}`;
  if (lang === "en") return SYMBOL_TIGHT.includes(cur.sym) ? `${cur.sym}${grp(",")}${d ? "." + d : ""}` : `${cur.sym} ${grp(",")}${d ? "." + d : ""}`;
  return cur.sym === "€" ? `€ ${grp(".")}${d ? "," + d : ""}` : `${cur.sym} ${grp(".")}${d ? "," + d : ""}`;
}
// runder Betrag in Landeswährung (für Rechnungen, Freigabegrenze …)
export function scaled(code, eur, step = 10) {
  const f = CUR[COUNTRIES[countryOf(code)].cur].f;
  const v = eur * f;
  const s = v >= 100000 ? 1000 : v >= 10000 ? 100 : step;
  return Math.round(v / s) * s;
}
export const lockerPrices = (code) => CUR[COUNTRIES[countryOf(code)].cur].lock;

// ---------- Kontonummer: die letzten 4 Ziffern sind immer k ----------
export function account(code, k, bank) {
  const c = COUNTRIES[countryOf(code)];
  if (code === "AT") return bank ? `AT20 3200 0000 1177 ${k}` : `AT61 1904 3002 3457 ${k}`;
  if (c.bank === "US") return `Routing ${bank ? "021000021" : "026009593"} · Acct. 4831 22${k}`;
  if (c.bank === "CA") return `Transit ${bank ? "00012" : "04521"} · Inst. 004 · Acct. 52${k}`;
  if (c.bank === "AU") return `BSB ${bank ? "062-000" : "083-004"} · Acct. 12${k}`;
  if (c.bank === "NZ") return `${bank ? "12-3140" : "06-0501"}-00${k}`;
  if (c.bank === "XX") return `Acct. ${bank ? "7700 3100" : "4400 1204"} ${k}`;
  const [cc, len, letters] = c.iban;
  let body = (bank ? "31" : "44") + (letters ? (bank ? "BANK" : "NORD") : "");
  const digits = bank ? "700202700015" : "500105170000";
  let i = 0;
  while ((cc + body).length < len - 4) body += digits[i++ % digits.length];
  // Die gesuchten letzten 4 Ziffern stehen immer als eigener Block (sonst zerfallen sie z. B. in DE auf zwei Gruppen)
  return `${(cc + body).replace(/(.{4})/g, "$1 ").trim()} ${k}`;
}

// ---------- Kennzeichen und Handynummern (aus den gespeicherten Zufallswerten abgeleitet) ----------
const ABC = "ABCDEFGHJKLMNPRSTUVWXYZ";
export function plate(code, city, raw) {
  const m = /^[A-Z]+-(\d+)([A-Z]{2})$/.exec(raw || "");
  if (!m) return raw;
  const c = COUNTRIES[countryOf(code)];
  const digits = (m[1] + [...m[1]].reverse().join("") + m[1]).split("");
  const seed = [...m[2]].map((ch) => ABC.indexOf(ch)).map((x) => (x < 0 ? 0 : x));
  let di = 0, li = 0;
  const key = String(city || "").trim().toLowerCase();
  const cityCode = (c.codes && c.codes[key]) || c.defaultCode || (String(city || "X").trim()[0] || "X").toUpperCase().replace(/[^A-Z]/, "X");
  return c.plate.replace(/[LDC]/g, (t) => {
    if (t === "C") return cityCode;
    if (t === "D") return digits[di++ % digits.length];
    const x = ABC[(seed[li % 2] + li * 7) % ABC.length]; li++; return x;
  });
}
// Offiziell für Film und Fernsehen reservierte Handynummern (werden nie vergeben). Quellen: Ofcom (GB), ComReg (IE),
// NANPA 555-0100–0199 (US, CA), ACMA (AU), Bundesnetzagentur (DE, Telekom 0171 39200 00–99), ARCEP (FR 06 39 98),
// PTS (SE 070-174 06 05–99). Stand Oktober 2026. Die freien Stellen kommen aus den letzten Ziffern der Zufallsnummer.
const FIC_AU = ["0491 570 006", "0491 570 156", "0491 570 157", "0491 570 158", "0491 570 159", "0491 570 110", "0491 570 313", "0491 570 737",
  "0491 571 266", "0491 571 491", "0491 571 804", "0491 572 549", "0491 572 665", "0491 572 983", "0491 573 770", "0491 573 087", "0491 574 118",
  "0491 574 632", "0491 575 254", "0491 575 789", "0491 576 398", "0491 576 801", "0491 577 426", "0491 577 644", "0491 578 957", "0491 578 148",
  "0491 578 888", "0491 579 212", "0491 579 760", "0491 579 455"];
const AREA = { "New York": "212", Chicago: "312", Boston: "617", "San Francisco": "415", Seattle: "206", Austin: "512", Denver: "303", Atlanta: "404",
  Toronto: "416", Vancouver: "604", "Montréal": "514", Montreal: "514", Calgary: "403", Ottawa: "613", Edmonton: "780", Winnipeg: "204", Halifax: "902" };
const FICTION = {
  GB: (d) => `07700 900${d.slice(-3)}`,
  IE: (d) => `089 011 0${d.slice(-3)}`,
  US: (d, x) => `(${AREA[x.city] || "212"}) 555-01${d.slice(-2)}`,
  CA: (d, x) => `(${AREA[x.city] || "416"}) 555-01${d.slice(-2)}`,
  AU: (d, x) => FIC_AU[(Number(d.slice(0, 2)) + 7 * (x.i || 0)) % FIC_AU.length],
  DE: (d) => `0171 39200${d.slice(-2)}`,
  FR: (d) => `06 39 98 ${d.slice(-4, -2)} ${d.slice(-2)}`,
  SE: (d) => `070-174 06 ${d.slice(-2)}`,
};
export function mobile(code, tel, x = {}) {
  const k = countryOf(code), c = COUNTRIES[k];
  const raw = String(tel || "").replace(/\D/g, "");
  if (FICTION[k] && raw.length >= 4) return FICTION[k](raw, x);
  const d = raw.slice(-7).split("").map(Number);
  if (!d.length) return tel;
  // Die 7 Zufallsziffern bilden das Ende der Nummer; fehlende Stellen vorne werden deterministisch daraus abgeleitet
  const n = (c.mob.match(/D/g) || []).length;
  const pre = [];
  let h = d.reduce((a, x, i) => a * 31 + x * (i + 7), 17);
  while (pre.length < Math.max(0, n - d.length)) { h = (h * 1103515245 + 12345) % 2147483648; pre.push(2 + ((h >> 16) % 8)); }
  const all = [...pre, ...d].slice(-n);
  let i = 0;
  if (!mobileMasked(k)) return c.mob.replace(/D/g, () => all[i++]);
  // nur die letzten vier frei gewählten Ziffern zeigen, feste Vorwahl bleibt: „0664 ••• 4733“
  return c.mob.replace(/D/g, () => { const x = all[i++]; return i > n - 4 ? x : "•"; });
}
// Länder ohne offiziellen Film-Nummernbereich: Vorwahl und die letzten vier Ziffern bleiben sichtbar, der Rest wird
// verdeckt („0664 ••• 4733“) – so ist keine echte Nummer anrufbar, und Telefonliste und Chat passen weiter zusammen.
export const mobileMasked = (code) => { const k = countryOf(code); return !FICTION[k] && !COUNTRIES[k].fictional; };

// ---------- Städte und Namen ----------
export function cityName(code, local, lang) {
  const c = COUNTRIES[countryOf(code)];
  const hit = c.cities.find((x) => x[0] === local);
  if (!hit) return local;
  return (lang === "en" ? hit[2] : hit[3]) || hit[0];
}
// weibliche Form von Nachnamen, wo die Sprache das verlangt
export function surname(code, last, female) {
  const c = COUNTRIES[countryOf(code)];
  if (!female) return last;
  if (c.femaleSuffix) { // PL/CZ/SK
    if (code === "PL") return last.replace(/ski$/, "ska").replace(/cki$/, "cka").replace(/dzki$/, "dzka");
    if (/ý$/.test(last)) return last.replace(/ý$/, "á");
    if (/[aeiou]$/i.test(last)) return last;
    return last + "ová";
  }
  if (c.femaleA) return /ov$|ev$|in$/.test(last) ? last + "a" : last;
  if (c.femaleGreek) return last.replace(/opoulos$/, "opoulou").replace(/akis$/, "aki").replace(/is$/, "i").replace(/ou$/, "ou").replace(/os$/, "ou").replace(/as$/, "a");
  if (c.femaleLatvian) return last.replace(/š$/, "a").replace(/s$/, "a");
  if (c.femaleLithuanian) return last.replace(/as$/, "ienė").replace(/is$/, "ienė").replace(/us$/, "ienė").replace(/ys$/, "ienė");
  if (c.patronymic) return last.replace(/sson$/, "sdóttir").replace(/son$/, "dóttir");
  return last;
}

// ---------- Fiktive Firmen ----------
// Rollen: [Funktion DE, Funktion EN, Abteilung DE, Abteilung EN]
const ROLES = [
  ["Teamleitung", "Team Lead", "Vertrieb", "Sales"], ["Leiter/in", "Head of IT", "IT", "IT"], ["Key Account", "Key Account Manager", "Kundenbetreuung", "Client Services"],
  ["Controlling", "Financial Controller", "Finanzen", "Finance"], ["Projektleitung", "Project Manager", "Marketing", "Marketing"], ["Einkauf", "Buyer", "Einkauf", "Procurement"],
  ["Personalleitung", "HR Manager", "Personal", "HR"], ["Qualitätsmanagement", "Quality Manager", "Qualität", "Quality"], ["Produktionsleitung", "Production Manager", "Produktion", "Production"],
  ["Recht", "Legal Counsel", "Recht", "Legal"], ["Logistik", "Logistics Coordinator", "Logistik", "Logistics"], ["Kommunikation", "Communications Manager", "Kommunikation", "Communications"],
];
const INDUSTRY = [["Logistik", "Logistics"], ["Maschinenbau", "Engineering"], ["Software", "Software"], ["Versicherung", "Insurance"], ["Energie", "Energy"],
  ["Consulting", "Consulting"], ["Bau", "Construction"], ["Textil", "Textiles"], ["Feinkost", "Fine Foods"], ["Pharma", "Pharma"], ["Hotels", "Hotels"], ["Medien", "Media"]];
const FEIER = [["Dachterrasse", "roof terrace"], ["Kantine", "canteen"], ["Lounge", "lounge"], ["Sonnenterrasse", "sun terrace"]];
const BOSS_FKT = [["Vorsitzende des Aufsichtsrats", "Vorsitzender des Aufsichtsrats", "Chair of the Board"], ["Eigentümerin", "Eigentümer", "Owner"], ["CEO der Gruppe", "CEO der Gruppe", "Group CEO"]];

// Begriffe der handverlesenen AT/DE/CH-Firmen auf Englisch (Funktion, Abteilung, Räume)
export const TERMS_EN = {
  "Aktuar": "Actuary", "Angebote": "Tenders", "Aufsichtsratsvorsitzende": "Chair of the Supervisory Board", "Aufsichtsratsvorsitzender": "Chair of the Supervisory Board",
  "Baukantine": "site canteen", "Bauleitung": "Site Manager", "Beratung": "Consulting", "Beschaffung": "Procurement", "Buchhaltung": "Accountant", "Bürgermeisterin a. D. und Aufsichtsratsvorsitzende": "Former Mayor and Chair of the Board",
  "Büro der Geschäftsführung": "Executive Office", "Büro der Geschäftsleitung": "Executive Office", "CEO": "CEO", "Chefbüro": "Boss's Office", "Dachterrasse": "roof terrace", "Direktionsbüro": "Director's Office", "Direktor": "Managing Director",
  "Disposition": "Dispatch", "Eigentümer": "Owner", "Eigentümerin": "Owner", "Einkauf": "Procurement", "Einkauf Übersee": "Overseas Buyer", "Energieberatung": "Energy Advisor", "Entwicklung": "Development",
  "Eventhalle": "event hall", "Eventmanagement": "Event Manager", "Events": "Events", "Export": "Export Manager", "Finanzbuchhaltung": "Accountant", "Finanzen": "Finance", "Firmengründer": "Company Founder",
  "Flottenleitung": "Fleet Manager", "Fuhrpark": "Fleet Manager", "Förderberatung": "Grants Advisor", "Gastronomie": "Catering", "Geschäftsführende Partnerin": "Managing Partner", "Geschäftsführer": "Managing Director",
  "Geschäftsführerin": "Managing Director", "Gesellschafter": "Shareholder", "Gesellschafterin": "Shareholder", "Gründer und Gesellschafter": "Founder and Shareholder", "Gründer und Verwaltungsrat": "Founder and Board Member",
  "Handel": "Trading", "Haustechnik": "Facilities", "Hochbau": "Building Construction", "Informatik": "IT", "Investorin": "Investor", "Kalkulation": "Estimator", "Kantine": "canteen", "Kollektion": "Collection",
  "Kommunikation": "Communications", "Konstruktion": "Design Engineer", "Kundenbetreuung": "Client Services", "Kundendienst": "Customer Service", "Kundenservice": "Customer Service", "Küche": "Kitchen",
  "Labor": "Laboratory", "Laborleitung": "Lab Manager", "Lager": "Warehouse", "Lagerleitung": "Warehouse Manager", "Leiter": "Head", "Leitung": "Head", "Logistik": "Logistics", "Lounge": "lounge", "Lounge im 12. Stock": "12th-floor lounge",
  "Mandatsleiterin": "Client Manager", "Marketingleitung": "Head of Marketing", "Mathematik": "Actuarial", "Montageleitung": "Installation Manager", "Netzbetrieb": "Grid Operations", "Offerten": "Tenders", "Online": "Online",
  "Online-Marketing": "Online Marketing", "Onlineshop": "Online Shop Manager", "Orangerie": "orangery", "Panorama-Lounge": "panorama lounge", "Personal": "HR", "Personalleitung": "HR Manager", "Personalrestaurant": "staff restaurant",
  "Polier": "Site Foreman", "Produkte": "Products", "Produktion": "Production", "Produktionsleiter": "Production Manager", "Produktmanagement": "Product Manager", "Projekte": "Projects", "Projektleitung": "Project Manager",
  "Qualität": "Quality", "Qualitätsmanagement": "Quality Manager", "Qualitätssicherung": "Quality Assurance", "Recht": "Legal", "Risiko": "Risk", "Rooftop-Lounge": "rooftop lounge", "Schaden": "Claims", "Schadenleitung": "Head of Claims",
  "Seniorpartner": "Senior Partner", "Showroom-Lounge": "showroom lounge", "Sonnenterrasse": "sun terrace", "Technik": "Engineering", "Teamleitung": "Team Lead", "Tiefbau": "Civil Engineering", "Treuhand": "Fiduciary Services",
  "Verkauf": "Sales", "Versand": "Shipping", "Vertrieb": "Sales", "Vertrieb Asien": "Sales Asia", "Vertrieb Handel": "Retail Sales", "Vertrieb Schweiz": "Sales Switzerland", "Vertriebsleitung": "Head of Sales",
  "Verwaltung": "Administration", "Verwaltungsratspräsident": "Chair of the Board", "Verwaltungsratspräsidentin": "Chair of the Board", "Vinothek": "wine bar", "Vorsitzender des Aufsichtsrats": "Chair of the Supervisory Board",
  "Vorstand": "Chief Executive", "Vorstandsbüro": "Executive Office", "Vorstandsvorsitzender": "Chief Executive", "Vorständin": "Chief Executive", "Werkskantine": "factory canteen", "Zollabwicklung": "Customs Clearance", "Zulassung": "Regulatory",
};
const tEN = (s) => TERMS_EN[s] || s;

// Übersetzt eine handverlesene Besetzung ins Englische (Namen und Firmen bleiben)
export function castToEnglish(cast) {
  const out = { ...cast };
  for (const [k, v] of Object.entries(cast)) if (/_FKT$|_ABT$|^RAUM_/.test(k)) out[k] = tEN(v);
  out.STADT = cityName(cast.LAND, cast.STADT, "en");
  // „Leiter“/„Leitung“ allein heißt auf Englisch „Head“ – mit Abteilung: „Head of IT“
  for (let i = 1; i <= 6; i++) if (out[`S${i}_FKT`] === "Head" && out[`S${i}_ABT`]) out[`S${i}_FKT`] = `Head of ${out[`S${i}_ABT`]}`;
  return out;
}

// Bahnhof mit Gepäckschließfächern je Stadt (englische Runden): echte Namen, wo es einen passenden Bahnhof gibt,
// sonst ein Busbahnhof (z. B. Hobart hat keinen Personenbahnhof). Ausgabe: „{Stadt} {HBF}“
const HBF_EN = {
  London: "King's Cross", Manchester: "Piccadilly", Birmingham: "New Street", Edinburgh: "Waverley", Glasgow: "Central Station", Leeds: "Station",
  Bristol: "Temple Meads", Liverpool: "Lime Street",
  Dublin: "Heuston Station", Cork: "Kent Station", Galway: "Ceannt Station", Limerick: "Colbert Station", Waterford: "Plunkett Station",
  Kilkenny: "MacDonagh Station", Sligo: "Mac Diarmada Station", Athlone: "Station",
  "New York": "Penn Station", Chicago: "Union Station", Boston: "South Station", "San Francisco": "Transbay Terminal", Seattle: "King Street Station",
  Austin: "Bus Station", Denver: "Union Station", Atlanta: "Peachtree Station",
  Toronto: "Union Station", Vancouver: "Pacific Central Station", "Montréal": "Central Station", Montreal: "Central Station", Calgary: "Bus Station",
  Ottawa: "Station", Edmonton: "Bus Station", Winnipeg: "Union Station", Halifax: "Station",
  Sydney: "Central Station", Melbourne: "Southern Cross Station", Brisbane: "Roma Street Station", Perth: "Station", Adelaide: "Railway Station",
  Canberra: "Railway Station", Hobart: "Bus Station", "Gold Coast": "Bus Station",
  Auckland: "Britomart Station", Wellington: "Railway Station", Christchurch: "Bus Interchange", Hamilton: "Transport Centre", Dunedin: "Railway Station",
  Tauranga: "Bus Station",
};

// Würfelt eine fiktive Firma aus den Länderlisten (für alle Länder ohne handverlesene Firmen)
export function randomCast(code, lang, rand) {
  const c = COUNTRIES[countryOf(code)];
  const en = lang === "en";
  const pick = (a) => a[rand(a.length)];
  const [cityLocal, park] = pick(c.cities);
  const city = cityName(code, cityLocal, lang);
  const usedLast = new Set([c.cop]);
  const usedFirst = new Set();
  const person = (female) => {
    let f, l, guard = 0;
    do { f = pick(female ? c.f : c.m); } while (usedFirst.has(f) && guard++ < 50);
    usedFirst.add(f);
    guard = 0;
    const pool = c.patronymic ? c.l.filter((x) => /son$/.test(x)) : c.l;
    do { l = pick(pool); } while (usedLast.has(l) && guard++ < 80);
    usedLast.add(l);
    return `${f} ${surname(code, l, female)}`;
  };
  const ind = pick(INDUSTRY);
  const founder = pick(c.l.filter((x) => !usedLast.has(x) && !/dóttir$/.test(x)));
  usedLast.add(founder);
  const base = rand(2) ? founder : cityLocal.replace(/[-\s].*$/, "");
  const firma = `${base} ${en || !GERMAN_SPEAKING.includes(code) ? ind[1] : ind[0]} ${c.suffix}`;
  const vFem = !!rand(2), bFem = !!rand(2);
  const bf = pick(BOSS_FKT);
  const feier = pick(FEIER);
  const out = {
    LAND: code, FIRMA: firma, STADT: city, PARK: park, RAUM_FEIER: en ? feier[1] : feier[0], RAUM_TATORT: en ? "Executive Office" : "Büro der Geschäftsführung",
    OPFER: person(vFem), OPFER_ANR: vFem ? "Frau" : "Herr", OPFER_FKT: en ? (code === "US" || code === "CA" ? "CEO" : "Managing Director") : vFem ? "Geschäftsführerin" : "Geschäftsführer",
    BOSS: person(bFem), BOSS_ANR: bFem ? "Frau" : "Herr", BOSS_FKT: en ? bf[2] : bFem ? bf[0] : bf[1],
  };
  const roles = [...ROLES];
  for (let i = roles.length - 1; i > 0; i--) { const j = rand(i + 1); [roles[i], roles[j]] = [roles[j], roles[i]]; }
  for (let i = 1; i <= 6; i++) {
    const fem = i % 2 === 1;
    const r = roles[i - 1];
    Object.assign(out, { [`S${i}`]: person(fem), [`S${i}_ANR`]: fem ? "Frau" : "Herr",
      [`S${i}_FKT`]: en ? r[1] : r[0].replace("Leiter/in", fem ? "Leiterin" : "Leiter"), [`S${i}_ABT`]: en ? r[3] : r[2] });
  }
  return out;
}

// ---------- Amerikanisches Englisch für Teams-Runden in den USA ----------
// Die englischen Texte sind britisch geschrieben; für US-Firmen werden Wortschatz und Schreibweise angepasst.
// Nur Text zwischen HTML-Tags wird verändert. Uhrzeiten (24 h), Beträge, Codes und Stockwerke bleiben gleich.
const US_WORDS = [
  [/\bunderground car park\b/g, "parking garage"], [/\bUnderground car park\b/g, "Parking garage"],
  [/\bcar parks\b/g, "parking garages"], [/\bcar park\b/g, "parking garage"], [/\bCar park\b/g, "Parking garage"],
  [/\bmobile phones\b/g, "cell phones"], [/\bmobile phone\b/g, "cell phone"], [/\bMobile phone\b/g, "Cell phone"],
  [/\bWork mobiles\b/g, "Work cell phones"], [/\bWork mobile\b/g, "Work cell"], [/\bwork mobiles\b/g, "work cell phones"], [/\bwork mobile\b/g, "work cell"],
  [/\bnumber plates?\b/g, (m) => m.replace("number plate", "license plate")], [/\bNumber plate\b/g, "License plate"],
  [/\bleft-luggage lockers\b/g, "luggage lockers"], [/\bLeft-luggage lockers\b/g, "Luggage lockers"],
  [/\bin hospital\b/g, "in the hospital"], [/\bbiscuits\b/g, "cookies"], [/\bmaths\b/g, "math"],
  [/\bcamomile\b/g, "chamomile"], [/\bCamomile\b/g, "Chamomile"], [/\bcity centre\b/g, "downtown"],
  [/\bwastepaper basket\b/g, "wastebasket"], [/\bcopy room bin\b/g, "copy room trash can"], [/\bfish and chips\b/g, "fish tacos"],
  [/\bFavourite holiday\b/g, "Favorite vacation"], [/\bholiday\b/g, "vacation"],
  [/\bfavourite\b/g, "favorite"], [/\bFavourite\b/g, "Favorite"], [/\bcolour/g, "color"], [/\bColour/g, "Color"],
  [/\bcentre\b/g, "center"], [/\bCentre\b/g, "Center"], [/\bprogramme\b/g, "program"], [/\bgrey\b/g, "gray"],
  [/\bcancelled\b/g, "canceled"], [/\blabelled\b/g, "labeled"], [/\btravelled\b/g, "traveled"], [/\bcatalogue\b/g, "catalog"],
  [/\b(metre|kilometre|litre)(s?)\b/g, (m, a, s) => a.replace(/re$/, "er") + s],
  [/\b(organ|recogn|real|apolog|prioriti|summar|author|minim|maxim|special|emphas|criticis|memor)is(e|ed|es|ing|ation)\b/g, (m, a, b) => `${a}iz${b}`],
  [/\b(Mr|Mrs|Ms|Dr)(?= [A-Z])/g, "$1."],
];
export function americanize(html, prompt = false) {
  let out = String(html ?? "").split(/(<[^>]*>)/).map((part) => (part.startsWith("<") ? part : US_WORDS.reduce((t, [re, to]) => t.replace(re, to), part))).join("");
  if (prompt) out = out.replace(/\bin English\b/g, "in American English").replace(/\bin British English\b/g, "in American English");
  return out;
}
export const isUS = (v) => v && v.LANG === "en" && v.LAND === "US";
