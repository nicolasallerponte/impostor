// Base de datos de futbolistas.
// Formato: Nombre|Posición|País|Época|Nivel|Clubes (separados por coma, en orden de carrera)
//   Posición: P portero · D defensa · M centrocampista · F delantero
//   Época:    a = en activo · l = leyenda / retirado
//   Nivel:    1 = crack mundial · 2 = muy conocido · 3 = para frikis del FIFA
// Para añadir uno, pega una línea más. Los nombres deben ser únicos.
const RAW = `
# ---------- Real Madrid ----------
Kylian Mbappé|F|Francia|a|1|Mónaco,PSG,Real Madrid
Vinícius Júnior|F|Brasil|a|1|Flamengo,Real Madrid
Jude Bellingham|M|Inglaterra|a|1|Birmingham,Dortmund,Real Madrid
Rodrygo|F|Brasil|a|1|Santos,Real Madrid
Federico Valverde|M|Uruguay|a|1|Peñarol,Deportivo,Real Madrid
Thibaut Courtois|P|Bélgica|a|1|Genk,Atlético,Chelsea,Real Madrid
Eduardo Camavinga|M|Francia|a|2|Rennes,Real Madrid
Aurélien Tchouaméni|M|Francia|a|2|Burdeos,Mónaco,Real Madrid
Éder Militão|D|Brasil|a|2|São Paulo,Oporto,Real Madrid
Antonio Rüdiger|D|Alemania|a|2|Stuttgart,Roma,Chelsea,Real Madrid
Dani Carvajal|D|España|a|1|Leverkusen,Real Madrid
Ferland Mendy|D|Francia|a|2|Lyon,Real Madrid
Arda Güler|M|Turquía|a|2|Fenerbahçe,Real Madrid
Brahim Díaz|F|Marruecos|a|2|Manchester City,Real Madrid,Milan
Trent Alexander-Arnold|D|Inglaterra|a|1|Liverpool,Real Madrid
Dean Huijsen|D|España|a|2|Juventus,Bournemouth,Real Madrid
Álvaro Carreras|D|España|a|3|Granada,Benfica,Real Madrid
Franco Mastantuono|M|Argentina|a|2|River Plate,Real Madrid
Endrick|F|Brasil|a|2|Palmeiras,Real Madrid
Lucas Vázquez|D|España|a|2|Espanyol,Real Madrid
David Alaba|D|Austria|a|2|Bayern,Real Madrid
Joselu|F|España|a|2|Celta,Espanyol,Real Madrid
Andriy Lunin|P|Ucrania|a|3|Leganés,Valladolid,Oviedo,Real Madrid
Nacho|D|España|a|3|Real Madrid,Al-Qadsiah
Dani Ceballos|M|España|a|3|Betis,Real Madrid,Arsenal
Casemiro|M|Brasil|a|1|São Paulo,Real Madrid,Manchester United
Isco|M|España|a|1|Valencia,Málaga,Real Madrid,Sevilla,Betis
Marco Asensio|F|España|a|2|Mallorca,Real Madrid,PSG,Aston Villa,Fenerbahçe
James Rodríguez|M|Colombia|a|1|Banfield,Oporto,Mónaco,Real Madrid,Bayern,Everton,Rayo
Keylor Navas|P|Costa Rica|a|2|Levante,Real Madrid,PSG
Álvaro Morata|F|España|a|1|Real Madrid,Juventus,Chelsea,Atlético,Milan
Theo Hernández|D|Francia|a|1|Atlético,Alavés,Real Madrid,Real Sociedad,Milan,Al-Hilal
Achraf Hakimi|D|Marruecos|a|1|Real Madrid,Dortmund,Inter,PSG
Martin Ødegaard|M|Noruega|a|1|Real Madrid,Real Sociedad,Arsenal
Mateo Kovačić|M|Croacia|a|2|Inter,Real Madrid,Chelsea,Manchester City
Sergio Reguilón|D|España|a|3|Real Madrid,Sevilla,Tottenham
Luka Jović|F|Serbia|a|3|Eintracht,Real Madrid,Fiorentina,Milan
Sergio Ramos|D|España|a|1|Sevilla,Real Madrid,PSG,Monterrey
Luka Modrić|M|Croacia|a|1|Dinamo Zagreb,Tottenham,Real Madrid,Milan
Karim Benzema|F|Francia|a|1|Lyon,Real Madrid,Al-Ittihad
Cristiano Ronaldo|F|Portugal|a|1|Sporting,Manchester United,Real Madrid,Juventus,Al-Nassr
Ángel Di María|F|Argentina|a|1|Rosario Central,Benfica,Real Madrid,Manchester United,PSG,Juventus
Raúl|F|España|l|1|Real Madrid,Schalke
Iker Casillas|P|España|l|1|Real Madrid,Oporto
Marcelo|D|Brasil|l|1|Fluminense,Real Madrid,Olympiacos
Toni Kroos|M|Alemania|l|1|Bayern,Leverkusen,Real Madrid
Gareth Bale|F|Gales|l|1|Southampton,Tottenham,Real Madrid
Pepe|D|Portugal|l|1|Oporto,Real Madrid,Besiktas
Xabi Alonso|M|España|l|1|Real Sociedad,Liverpool,Real Madrid,Bayern
Mesut Özil|M|Alemania|l|1|Schalke,Werder Bremen,Real Madrid,Arsenal
Gonzalo Higuaín|F|Argentina|l|1|River Plate,Real Madrid,Napoli,Juventus,Milan,Chelsea
Kaká|M|Brasil|l|1|São Paulo,Milan,Real Madrid
Zinedine Zidane|M|Francia|l|1|Burdeos,Juventus,Real Madrid
Luís Figo|F|Portugal|l|1|Sporting,Barcelona,Real Madrid,Inter
Ronaldo Nazário|F|Brasil|l|1|Cruzeiro,PSV,Barcelona,Inter,Real Madrid,Milan
Roberto Carlos|D|Brasil|l|1|Palmeiras,Inter,Real Madrid,Fenerbahçe
David Beckham|M|Inglaterra|l|1|Manchester United,Real Madrid,LA Galaxy,Milan,PSG
Fernando Hierro|D|España|l|2|Valladolid,Real Madrid
Fernando Redondo|M|Argentina|l|2|Argentinos Juniors,Tenerife,Real Madrid,Milan
Michel Salgado|D|España|l|3|Celta,Real Madrid
Guti|M|España|l|2|Real Madrid,Besiktas
Claude Makélélé|M|Francia|l|2|Nantes,Marsella,Celta,Real Madrid,Chelsea,PSG
Michael Owen|F|Inglaterra|l|2|Liverpool,Real Madrid,Newcastle,Manchester United
Robinho|F|Brasil|l|2|Santos,Real Madrid,Manchester City,Milan
Ruud van Nistelrooy|F|Países Bajos|l|1|PSV,Manchester United,Real Madrid
Arjen Robben|F|Países Bajos|l|1|PSV,Chelsea,Real Madrid,Bayern
Wesley Sneijder|M|Países Bajos|l|2|Ajax,Real Madrid,Inter,Galatasaray
Fabio Cannavaro|D|Italia|l|1|Napoli,Parma,Inter,Juventus,Real Madrid
Álvaro Arbeloa|D|España|l|3|Deportivo,Liverpool,Real Madrid
Raphaël Varane|D|Francia|l|1|Lens,Real Madrid,Manchester United
Eden Hazard|F|Bélgica|l|1|Lille,Chelsea,Real Madrid
Fernando Morientes|F|España|l|2|Zaragoza,Real Madrid,Mónaco,Liverpool,Valencia
Emilio Butragueño|F|España|l|2|Real Madrid
Hugo Sánchez|F|México|l|2|Atlético,Real Madrid
Alfredo Di Stéfano|F|Argentina|l|2|River Plate,Millonarios,Real Madrid
Ferenc Puskás|F|Hungría|l|3|Honvéd,Real Madrid
Esteban Cambiasso|M|Argentina|l|3|Independiente,River Plate,Real Madrid,Inter,Leicester
Javier Saviola|F|Argentina|l|2|River Plate,Barcelona,Mónaco,Sevilla,Real Madrid,Benfica
Klaas-Jan Huntelaar|F|Países Bajos|l|3|Ajax,Real Madrid,Milan,Schalke
Sami Khedira|M|Alemania|l|2|Stuttgart,Real Madrid,Juventus
Fábio Coentrão|D|Portugal|l|3|Benfica,Real Madrid,Mónaco
Iván Zamorano|F|Chile|l|2|Sevilla,Real Madrid,Inter
Míchel|M|España|l|3|Real Madrid
Savio|F|Brasil|l|3|Flamengo,Real Madrid,Burdeos,Zaragoza

# ---------- Barcelona ----------
Lionel Messi|F|Argentina|a|1|Barcelona,PSG,Inter Miami
Lamine Yamal|F|España|a|1|Barcelona
Pedri|M|España|a|1|Las Palmas,Barcelona
Gavi|M|España|a|1|Barcelona
Raphinha|F|Brasil|a|1|Vitória Guimarães,Sporting,Rennes,Leeds,Barcelona
Robert Lewandowski|F|Polonia|a|1|Lech Poznań,Dortmund,Bayern,Barcelona
Frenkie de Jong|M|Países Bajos|a|1|Ajax,Barcelona
Pau Cubarsí|D|España|a|2|Barcelona
Ronald Araújo|D|Uruguay|a|2|Boston River,Barcelona
Jules Koundé|D|Francia|a|2|Burdeos,Sevilla,Barcelona
Alejandro Balde|D|España|a|2|Barcelona
Marc-André ter Stegen|P|Alemania|a|1|Borussia Mönchengladbach,Barcelona
Joan García|P|España|a|2|Espanyol,Barcelona
Dani Olmo|M|España|a|1|Dinamo Zagreb,Leipzig,Barcelona
Fermín López|M|España|a|2|Linares,Barcelona
Ferran Torres|F|España|a|2|Valencia,Manchester City,Barcelona
Marcus Rashford|F|Inglaterra|a|1|Manchester United,Aston Villa,Barcelona
Íñigo Martínez|D|España|a|3|Real Sociedad,Athletic,Barcelona,Al-Nassr
Ansu Fati|F|España|a|2|Barcelona,Brighton,Mónaco
Eric García|D|España|a|3|Manchester City,Girona,Barcelona
Neymar|F|Brasil|a|1|Santos,Barcelona,PSG,Al-Hilal
Luis Suárez|F|Uruguay|a|1|Nacional,Ajax,Liverpool,Barcelona,Atlético,Inter Miami
Pedro|F|España|a|2|Barcelona,Chelsea,Roma,Lazio
Philippe Coutinho|M|Brasil|a|1|Vasco da Gama,Inter,Liverpool,Barcelona,Bayern,Aston Villa
Antoine Griezmann|F|Francia|a|1|Real Sociedad,Atlético,Barcelona
Ousmane Dembélé|F|Francia|a|1|Rennes,Dortmund,Barcelona,PSG
Arturo Vidal|M|Chile|a|2|Colo-Colo,Leverkusen,Juventus,Bayern,Barcelona,Inter
Alexis Sánchez|F|Chile|a|1|Colo-Colo,Udinese,Barcelona,Arsenal,Manchester United,Inter,Sevilla
Arthur Melo|M|Brasil|a|3|Grêmio,Barcelona,Juventus,Liverpool
Clément Lenglet|D|Francia|a|3|Sevilla,Barcelona,Tottenham,Atlético
Sergi Roberto|M|España|a|3|Barcelona,Como
İlkay Gündoğan|M|Alemania|a|2|Dortmund,Manchester City,Barcelona,Galatasaray
João Félix|F|Portugal|a|1|Benfica,Atlético,Chelsea,Barcelona,Milan,Al-Nassr
João Cancelo|D|Portugal|a|2|Benfica,Valencia,Inter,Juventus,Manchester City,Bayern,Barcelona,Al-Hilal
Memphis Depay|F|Países Bajos|a|2|PSV,Manchester United,Lyon,Barcelona,Atlético,Corinthians
Pierre-Emerick Aubameyang|F|Gabón|a|2|Saint-Étienne,Dortmund,Arsenal,Barcelona,Chelsea,Marsella
Adama Traoré|F|España|a|3|Barcelona,Aston Villa,Middlesbrough,Wolves,Fulham
Thiago Alcântara|M|España|l|2|Barcelona,Bayern,Liverpool
Sergio Busquets|M|España|l|1|Barcelona,Inter Miami
Jordi Alba|D|España|l|1|Valencia,Barcelona,Inter Miami
Xavi|M|España|l|1|Barcelona,Al-Sadd
Andrés Iniesta|M|España|l|1|Barcelona,Vissel Kobe
Carles Puyol|D|España|l|1|Barcelona
Gerard Piqué|D|España|l|1|Manchester United,Zaragoza,Barcelona
Ivan Rakitić|M|Croacia|l|1|Basilea,Schalke,Sevilla,Barcelona
Ronaldinho|M|Brasil|l|1|Grêmio,PSG,Barcelona,Milan
Samuel Eto'o|F|Camerún|l|1|Real Madrid,Mallorca,Barcelona,Inter,Chelsea
Thierry Henry|F|Francia|l|1|Mónaco,Juventus,Arsenal,Barcelona,New York Red Bulls
Rivaldo|M|Brasil|l|1|Palmeiras,Deportivo,Barcelona,Milan
Romário|F|Brasil|l|2|Vasco da Gama,PSV,Barcelona,Flamengo,Valencia
Hristo Stoichkov|F|Bulgaria|l|2|CSKA Sofía,Barcelona,Parma
Johan Cruyff|F|Países Bajos|l|1|Ajax,Barcelona,Feyenoord
Diego Maradona|M|Argentina|l|1|Argentinos Juniors,Boca Juniors,Barcelona,Napoli,Sevilla
Pep Guardiola|M|España|l|2|Barcelona,Brescia,Roma
Patrick Kluivert|F|Países Bajos|l|2|Ajax,Milan,Barcelona,Newcastle
Deco|M|Portugal|l|2|Oporto,Barcelona,Chelsea,Fluminense
Yaya Touré|M|Costa de Marfil|l|2|Olympiacos,Mónaco,Barcelona,Manchester City
Zlatan Ibrahimović|F|Suecia|l|1|Ajax,Juventus,Inter,Barcelona,Milan,PSG,Manchester United
David Villa|F|España|l|1|Sporting,Zaragoza,Valencia,Barcelona,Atlético
Cesc Fàbregas|M|España|l|1|Arsenal,Barcelona,Chelsea,Mónaco
Javier Mascherano|M|Argentina|l|1|River Plate,Corinthians,West Ham,Liverpool,Barcelona
Eric Abidal|D|Francia|l|3|Lille,Lyon,Barcelona
Víctor Valdés|P|España|l|2|Barcelona,Manchester United
Samuel Umtiti|D|Francia|l|3|Lyon,Barcelona
Ronald Koeman|D|Países Bajos|l|2|Ajax,PSV,Barcelona
Michael Laudrup|M|Dinamarca|l|2|Lazio,Juventus,Barcelona,Real Madrid
Gheorghe Hagi|M|Rumanía|l|3|Real Madrid,Barcelona,Galatasaray
Luis Enrique|M|España|l|2|Sporting,Real Madrid,Barcelona
Juan Román Riquelme|M|Argentina|l|1|Boca Juniors,Barcelona,Villarreal
Ludovic Giuly|F|Francia|l|3|Mónaco,Barcelona,Roma,PSG
Bojan Krkić|F|España|l|3|Barcelona,Roma,Milan,Ajax
Rafael Márquez|D|México|l|2|Atlas,Mónaco,Barcelona
Miralem Pjanić|M|Bosnia y Herzegovina|l|3|Lyon,Roma,Juventus,Barcelona
Thiago Motta|M|Italia|l|3|Barcelona,Atlético,Genoa,Inter,PSG
Quini|F|España|l|3|Sporting,Barcelona

# ---------- Atlético de Madrid ----------
Julián Álvarez|F|Argentina|a|1|River Plate,Manchester City,Atlético
Jan Oblak|P|Eslovenia|a|1|Benfica,Atlético
Koke|M|España|a|1|Atlético
Marcos Llorente|M|España|a|2|Real Madrid,Alavés,Atlético
Rodrigo De Paul|M|Argentina|a|1|Racing Club,Valencia,Udinese,Atlético,Inter Miami
Giuliano Simeone|F|Argentina|a|3|River Plate,Zaragoza,Alavés,Atlético
Ángel Correa|F|Argentina|a|2|San Lorenzo,Atlético,Tigres
Nahuel Molina|D|Argentina|a|3|Boca Juniors,Udinese,Atlético
Alexander Sørloth|F|Noruega|a|2|Crystal Palace,Real Sociedad,Villarreal,Atlético
José María Giménez|D|Uruguay|a|2|Danubio,Atlético
Conor Gallagher|M|Inglaterra|a|3|Chelsea,Crystal Palace,Atlético
Thiago Almada|M|Argentina|a|3|Vélez,Atlanta United,Botafogo,Lyon,Atlético
Álex Baena|M|España|a|2|Villarreal,Atlético
Robin Le Normand|D|España|a|3|Real Sociedad,Atlético
Saúl Ñíguez|M|España|a|2|Rayo,Atlético,Chelsea,Sevilla,Flamengo
Thomas Partey|M|Ghana|a|2|Mallorca,Atlético,Arsenal,Villarreal
Yannick Carrasco|F|Bélgica|a|2|Mónaco,Atlético,Al-Shabab
Lucas Hernández|D|Francia|a|2|Atlético,Bayern,PSG
Thomas Lemar|M|Francia|a|3|Mónaco,Atlético,Girona
Mario Hermoso|D|España|a|3|Espanyol,Atlético,Roma
Matheus Cunha|F|Brasil|a|2|Leipzig,Hertha,Atlético,Wolves,Manchester United
David de Gea|P|España|a|1|Atlético,Manchester United,Fiorentina
Fernando Torres|F|España|l|1|Atlético,Liverpool,Chelsea,Milan
Sergio Agüero|F|Argentina|l|1|Independiente,Atlético,Manchester City,Barcelona
Diego Forlán|F|Uruguay|l|1|Independiente,Manchester United,Villarreal,Atlético,Inter
Radamel Falcao|F|Colombia|l|1|River Plate,Oporto,Atlético,Mónaco,Rayo
Diego Costa|F|España|l|1|Atlético,Chelsea,Wolves
Diego Godín|D|Uruguay|l|1|Villarreal,Atlético,Inter
Filipe Luís|D|Brasil|l|2|Deportivo,Atlético,Chelsea,Flamengo
Juanfran|D|España|l|3|Real Madrid,Osasuna,Atlético
Gabi|M|España|l|3|Atlético,Zaragoza
Arda Turan|M|Turquía|l|2|Galatasaray,Atlético,Barcelona
Miranda|D|Brasil|l|3|São Paulo,Atlético,Inter
Diego Simeone|M|Argentina|l|1|Vélez,Sevilla,Atlético,Inter,Lazio
Paulo Futre|F|Portugal|l|3|Oporto,Atlético
Kiko|F|España|l|3|Cádiz,Atlético
Maxi Rodríguez|M|Argentina|l|3|Newell's,Espanyol,Atlético,Liverpool
Simão Sabrosa|F|Portugal|l|3|Benfica,Barcelona,Atlético

# ---------- Sevilla ----------
Jesús Navas|D|España|l|1|Sevilla,Manchester City
Frédéric Kanouté|F|Malí|l|2|West Ham,Tottenham,Sevilla
Luís Fabiano|F|Brasil|l|2|São Paulo,Oporto,Sevilla
Carlos Bacca|F|Colombia|l|2|Junior,Brujas,Sevilla,Milan,Villarreal
Kevin Gameiro|F|Francia|l|3|PSG,Sevilla,Atlético,Valencia
Éver Banega|M|Argentina|l|2|Boca Juniors,Valencia,Sevilla,Inter
José Antonio Reyes|F|España|l|2|Sevilla,Arsenal,Real Madrid,Atlético
Andrés Palop|P|España|l|3|Valencia,Villarreal,Sevilla
Davor Šuker|F|Croacia|l|2|Dinamo Zagreb,Sevilla,Real Madrid,Arsenal
Álvaro Negredo|F|España|l|2|Almería,Sevilla,Manchester City,Valencia
Papu Gómez|F|Argentina|a|2|San Lorenzo,Catania,Atalanta,Sevilla
Lucas Ocampos|F|Argentina|a|2|River Plate,Mónaco,Marsella,Sevilla,Ajax,Monterrey
Youssef En-Nesyri|F|Marruecos|a|2|Málaga,Leganés,Sevilla,Fenerbahçe
Yassine Bounou|P|Marruecos|a|2|Atlético,Girona,Sevilla,Al-Hilal
Diego Carlos|D|Brasil|a|3|Oporto,Nantes,Sevilla,Aston Villa
Wissam Ben Yedder|F|Francia|a|3|Toulouse,Sevilla,Mónaco
Suso|M|España|a|3|Liverpool,Milan,Sevilla
Gonzalo Montiel|D|Argentina|a|3|River Plate,Sevilla,Nottingham Forest

# ---------- Valencia ----------
David Silva|M|España|l|1|Valencia,Celta,Manchester City,Real Sociedad
Juan Mata|M|España|l|2|Valencia,Chelsea,Manchester United
Pablo Aimar|M|Argentina|l|2|River Plate,Valencia,Zaragoza,Benfica
Roberto Ayala|D|Argentina|l|2|River Plate,Napoli,Milan,Valencia
Gaizka Mendieta|M|España|l|2|Valencia,Lazio,Middlesbrough
Santiago Cañizares|P|España|l|2|Celta,Real Madrid,Valencia
Rubén Baraja|M|España|l|3|Valladolid,Atlético,Valencia
Vicente|F|España|l|3|Levante,Valencia
Roberto Soldado|F|España|l|2|Real Madrid,Getafe,Valencia,Tottenham,Villarreal
Joaquín|F|España|l|1|Betis,Valencia,Málaga,Fiorentina
Carlos Marchena|D|España|l|3|Sevilla,Valencia,Villarreal
Claudio López|F|Argentina|l|3|Racing Club,Valencia,Lazio
Mario Kempes|F|Argentina|l|2|Rosario Central,Valencia
Ezequiel Garay|D|Argentina|l|3|Racing Club,Real Madrid,Benfica,Zenit,Valencia
Paco Alcácer|F|España|l|3|Valencia,Barcelona,Dortmund,Villarreal
Kily González|M|Argentina|l|3|Boca Juniors,Zaragoza,Valencia,Inter
David Albelda|M|España|l|3|Valencia
Rodrigo Moreno|F|España|a|2|Benfica,Valencia,Leeds,Al-Rayyan
Dani Parejo|M|España|a|2|Real Madrid,Getafe,Valencia,Villarreal
Gonçalo Guedes|F|Portugal|a|3|Benfica,PSG,Valencia,Wolves,Real Sociedad
José Luis Gayà|D|España|a|2|Valencia
Carlos Soler|M|España|a|3|Valencia,PSG,Real Sociedad
Giorgi Mamardashvili|P|Georgia|a|2|Dinamo Tbilisi,Valencia,Liverpool

# ---------- Villarreal ----------
Marcos Senna|M|España|l|2|Corinthians,Villarreal
Santi Cazorla|M|España|a|1|Villarreal,Recreativo,Málaga,Arsenal,Oviedo
Giuseppe Rossi|F|Italia|l|2|Manchester United,Villarreal,Fiorentina
Gerard Moreno|F|España|a|2|Villarreal,Espanyol
Bruno Soriano|M|España|l|3|Villarreal
Pepe Reina|P|España|l|2|Barcelona,Villarreal,Liverpool,Napoli,Milan
Samuel Chukwueze|F|Nigeria|a|3|Villarreal,Milan,Fulham
Yeremy Pino|F|España|a|3|Villarreal,Crystal Palace
Pau Torres|D|España|a|2|Villarreal,Aston Villa
Ayoze Pérez|F|España|a|3|Tenerife,Newcastle,Leicester,Betis,Villarreal
Raúl Albiol|D|España|a|3|Getafe,Valencia,Real Madrid,Napoli,Villarreal
Robert Pires|M|Francia|l|2|Metz,Marsella,Arsenal,Villarreal

# ---------- Real Sociedad · Athletic ----------
Mikel Oyarzabal|F|España|a|1|Real Sociedad
Martín Zubimendi|M|España|a|2|Real Sociedad,Arsenal
Takefusa Kubo|F|Japón|a|2|Real Madrid,Mallorca,Villarreal,Getafe,Real Sociedad
Mikel Merino|M|España|a|2|Osasuna,Dortmund,Newcastle,Real Sociedad,Arsenal
Alexander Isak|F|Suecia|a|1|AIK,Dortmund,Real Sociedad,Newcastle,Liverpool
Brais Méndez|M|España|a|3|Celta,Real Sociedad
Álex Remiro|P|España|a|3|Athletic,Levante,Huesca,Real Sociedad
Carlos Vela|F|México|l|2|Arsenal,Osasuna,Real Sociedad,LAFC
Xabi Prieto|M|España|l|3|Real Sociedad
Nihat Kahveci|F|Turquía|l|3|Besiktas,Real Sociedad,Villarreal
Claudio Bravo|P|Chile|l|2|Colo-Colo,Real Sociedad,Barcelona,Manchester City,Betis
Nico Williams|F|España|a|1|Athletic
Iñaki Williams|F|Ghana|a|2|Athletic
Oihan Sancet|M|España|a|3|Athletic
Unai Simón|P|España|a|2|Athletic
Iker Muniain|F|España|a|2|Athletic,San Lorenzo
Ander Herrera|M|España|a|2|Zaragoza,Athletic,Manchester United,PSG,Boca Juniors
Kepa Arrizabalaga|P|España|a|2|Athletic,Chelsea,Real Madrid,Arsenal
Aymeric Laporte|D|España|a|2|Athletic,Manchester City,Al-Nassr
Aritz Aduriz|F|España|l|2|Athletic,Mallorca,Valencia
Javi Martínez|M|España|l|2|Osasuna,Athletic,Bayern
Fernando Llorente|F|España|l|2|Athletic,Juventus,Sevilla,Tottenham,Napoli
Julen Guerrero|M|España|l|2|Athletic
Joseba Etxeberria|F|España|l|3|Athletic
Raúl García|M|España|l|2|Osasuna,Atlético,Athletic
Andoni Zubizarreta|P|España|l|2|Athletic,Barcelona,Valencia

# ---------- Betis · Celta · Depor · resto de LaLiga ----------
Nabil Fekir|M|Francia|a|2|Lyon,Betis
Sergio Canales|M|España|a|2|Racing,Real Madrid,Valencia,Real Sociedad,Betis,Monterrey
Borja Iglesias|F|España|a|2|Celta,Espanyol,Betis,Leverkusen
Antony|F|Brasil|a|2|São Paulo,Ajax,Manchester United,Betis
Giovani Lo Celso|M|Argentina|a|2|Rosario Central,PSG,Betis,Tottenham,Villarreal
Guido Rodríguez|M|Argentina|a|3|River Plate,América,Betis,West Ham
William Carvalho|M|Portugal|a|3|Sporting,Betis
Marc Bartra|D|España|a|3|Barcelona,Dortmund,Betis,Trabzonspor
Cucho Hernández|F|Colombia|a|3|Watford,Mallorca,Getafe,Columbus Crew,Betis
Fabián Ruiz|M|España|a|2|Betis,Napoli,PSG
Pablo Fornals|M|España|a|3|Málaga,Villarreal,West Ham,Betis
Denílson|F|Brasil|l|2|São Paulo,Betis,Burdeos
Alfonso|F|España|l|3|Real Madrid,Betis,Barcelona
Rubén Castro|F|España|l|3|Las Palmas,Deportivo,Betis
Iago Aspas|F|España|a|1|Celta,Liverpool,Sevilla
Denis Suárez|M|España|a|3|Manchester City,Sevilla,Villarreal,Barcelona,Celta
Gabri Veiga|M|España|a|3|Celta,Al-Ahli,Oporto
Aleksandr Mostovoi|M|Rusia|l|2|Spartak Moscú,Celta
Valeri Karpin|M|Rusia|l|3|Real Sociedad,Valencia,Celta
Nolito|F|España|l|3|Barcelona,Benfica,Celta,Manchester City,Sevilla
Michu|F|España|l|3|Celta,Rayo,Swansea
Roy Makaay|F|Países Bajos|l|2|Tenerife,Deportivo,Bayern,Feyenoord
Diego Tristán|F|España|l|2|Mallorca,Deportivo
Juan Carlos Valerón|M|España|l|2|Las Palmas,Mallorca,Atlético,Deportivo
Mauro Silva|M|Brasil|l|2|Bragantino,Deportivo
Djalminha|M|Brasil|l|2|Palmeiras,Deportivo
Bebeto|F|Brasil|l|2|Flamengo,Vasco da Gama,Deportivo
Fran|M|España|l|3|Deportivo
Joan Capdevila|D|España|l|3|Espanyol,Atlético,Deportivo,Villarreal,Benfica
Lionel Scaloni|D|Argentina|l|2|Estudiantes,Deportivo,West Ham,Lazio
Andrés Guardado|M|México|l|2|Atlas,Deportivo,Valencia,PSV,Betis
Lucas Pérez|F|España|a|3|Deportivo,Arsenal,West Ham,Alavés,Cádiz
Júlio Baptista|F|Brasil|l|3|São Paulo,Sevilla,Real Madrid,Arsenal,Roma,Málaga
Martín Demichelis|D|Argentina|l|3|River Plate,Bayern,Málaga,Manchester City
Willy Caballero|P|Argentina|l|3|Boca Juniors,Elche,Málaga,Manchester City,Chelsea
Salomón Rondón|F|Venezuela|a|3|Málaga,Zenit,West Brom,Newcastle,Pachuca
Roque Santa Cruz|F|Paraguay|l|3|Olimpia,Bayern,Blackburn,Manchester City,Málaga
Raúl Tamudo|F|España|l|2|Espanyol,Real Sociedad,Rayo
Iván de la Peña|M|España|l|3|Barcelona,Lazio,Espanyol
Wu Lei|F|China|a|3|Shanghai SIPG,Espanyol
Borja Mayoral|F|España|a|3|Real Madrid,Roma,Getafe
Dani Güiza|F|España|l|3|Getafe,Mallorca,Fenerbahçe
Vedat Muriqi|F|Kosovo|a|3|Fenerbahçe,Lazio,Mallorca
Ante Budimir|F|Croacia|a|3|Crotone,Mallorca,Osasuna
Chimy Ávila|F|Argentina|a|3|San Lorenzo,Huesca,Osasuna,Betis
Isi Palazón|M|España|a|3|Ponferradina,Rayo
Óscar Trejo|M|Argentina|a|3|Boca Juniors,Mallorca,Rayo
Raúl de Tomás|F|España|a|3|Real Madrid,Rayo,Benfica,Espanyol
Artem Dovbyk|F|Ucrania|a|2|Dnipro,Girona,Roma
Savinho|F|Brasil|a|2|Atlético Mineiro,PSV,Girona,Manchester City
Aleix García|M|España|a|3|Manchester City,Eibar,Girona,Leverkusen
Cristhian Stuani|F|Uruguay|a|3|Danubio,Racing,Espanyol,Middlesbrough,Girona
Diego Milito|F|Argentina|l|2|Racing Club,Genoa,Zaragoza,Inter
Gabriel Milito|D|Argentina|l|3|Independiente,Zaragoza,Barcelona
Jonathan Viera|M|España|a|3|Las Palmas,Standard Lieja,Beijing Guoan
Kevin-Prince Boateng|M|Ghana|l|3|Tottenham,Milan,Schalke,Las Palmas,Barcelona
Jorge Valdano|F|Argentina|l|3|Alavés,Zaragoza,Real Madrid
Fabián Orellana|F|Chile|l|3|Udinese,Granada,Celta,Valencia,Eibar
Marc Cucurella|D|España|a|2|Barcelona,Eibar,Getafe,Brighton,Chelsea
Alejandro Grimaldo|D|España|a|2|Barcelona,Benfica,Leverkusen
Pedro Porro|D|España|a|3|Girona,Valladolid,Sporting,Tottenham
David Raya|P|España|a|2|Blackburn,Brentford,Arsenal
Pablo Sarabia|M|España|a|3|Getafe,Sevilla,PSG,Sporting,Wolves
Samu Aghehowa|F|España|a|3|Atlético,Alavés,Oporto
Rodri|M|España|a|1|Villarreal,Atlético,Manchester City

# ---------- Argentina por Europa ----------
Lautaro Martínez|F|Argentina|a|1|Racing Club,Inter
Paulo Dybala|F|Argentina|a|1|Instituto,Palermo,Juventus,Roma
Enzo Fernández|M|Argentina|a|1|River Plate,Benfica,Chelsea
Alexis Mac Allister|M|Argentina|a|1|Argentinos Juniors,Boca Juniors,Brighton,Liverpool
Emiliano Martínez|P|Argentina|a|1|Independiente,Arsenal,Aston Villa
Cristian Romero|D|Argentina|a|1|Belgrano,Genoa,Atalanta,Tottenham
Lisandro Martínez|D|Argentina|a|2|Newell's,Defensa y Justicia,Ajax,Manchester United
Nicolás Otamendi|D|Argentina|a|2|Vélez,Oporto,Valencia,Manchester City,Benfica
Nicolás Tagliafico|D|Argentina|a|3|Banfield,Independiente,Ajax,Lyon
Leandro Paredes|M|Argentina|a|2|Boca Juniors,Roma,Zenit,PSG,Juventus
Alejandro Garnacho|F|Argentina|a|2|Atlético,Manchester United,Chelsea
Nico Paz|M|Argentina|a|2|Real Madrid,Como
Giovanni Simeone|F|Argentina|a|3|River Plate,Genoa,Fiorentina,Napoli,Torino
Mauro Icardi|F|Argentina|a|2|Barcelona,Sampdoria,Inter,PSG,Galatasaray
Marcos Acuña|D|Argentina|a|3|Racing Club,Sporting,Sevilla,River Plate
Exequiel Palacios|M|Argentina|a|3|River Plate,Leverkusen
Nicolás González|F|Argentina|a|3|Argentinos Juniors,Stuttgart,Fiorentina,Juventus,Atlético
Javier Zanetti|D|Argentina|l|1|Banfield,Inter
Gabriel Batistuta|F|Argentina|l|1|Newell's,River Plate,Boca Juniors,Fiorentina,Roma,Inter
Hernán Crespo|F|Argentina|l|1|River Plate,Parma,Lazio,Inter,Chelsea,Milan
Juan Sebastián Verón|M|Argentina|l|2|Estudiantes,Boca Juniors,Sampdoria,Parma,Lazio,Manchester United,Chelsea
Carlos Tévez|F|Argentina|l|1|Boca Juniors,Corinthians,West Ham,Manchester United,Manchester City,Juventus
Walter Samuel|D|Argentina|l|2|Boca Juniors,Roma,Real Madrid,Inter
Pablo Zabaleta|D|Argentina|l|2|San Lorenzo,Espanyol,Manchester City,West Ham
Ezequiel Lavezzi|F|Argentina|l|2|San Lorenzo,Napoli,PSG
Javier Pastore|M|Argentina|l|2|Huracán,Palermo,PSG,Roma
Erik Lamela|F|Argentina|l|3|River Plate,Roma,Tottenham,Sevilla,AEK
Gabriel Heinze|D|Argentina|l|2|Valladolid,PSG,Manchester United,Real Madrid,Marsella
Ariel Ortega|F|Argentina|l|3|River Plate,Valencia,Sampdoria,Parma,Fenerbahçe
Claudio Caniggia|F|Argentina|l|3|River Plate,Atalanta,Roma,Benfica,Boca Juniors
Sergio Romero|P|Argentina|l|3|Racing Club,AZ,Sampdoria,Mónaco,Manchester United
Juan Pablo Sorín|D|Argentina|l|3|River Plate,Juventus,Barcelona,PSG,Villarreal
Lucas Biglia|M|Argentina|l|3|Independiente,Anderlecht,Lazio,Milan
Fernando Gago|M|Argentina|l|3|Boca Juniors,Real Madrid,Roma,Valencia

# ---------- Brasil por Europa ----------
Alisson Becker|P|Brasil|a|1|Internacional,Roma,Liverpool
Ederson|P|Brasil|a|2|Benfica,Manchester City,Fenerbahçe
Marquinhos|D|Brasil|a|1|Corinthians,Roma,PSG
Thiago Silva|D|Brasil|a|1|Fluminense,Milan,PSG,Chelsea
Gabriel Magalhães|D|Brasil|a|2|Lille,Arsenal
Gabriel Martinelli|F|Brasil|a|2|Ituano,Arsenal
Gabriel Jesus|F|Brasil|a|2|Palmeiras,Manchester City,Arsenal
Richarlison|F|Brasil|a|2|Fluminense,Watford,Everton,Tottenham
Bruno Guimarães|M|Brasil|a|2|Athletico Paranaense,Lyon,Newcastle
Lucas Paquetá|M|Brasil|a|2|Flamengo,Milan,Lyon,West Ham
Roberto Firmino|F|Brasil|a|1|Figueirense,Hoffenheim,Liverpool,Al-Ahli
Fabinho|M|Brasil|a|2|Real Madrid,Mónaco,Liverpool,Al-Ittihad
Hulk|F|Brasil|a|2|Oporto,Zenit,Atlético Mineiro
Willian|F|Brasil|a|2|Corinthians,Shakhtar,Chelsea,Arsenal,Fulham
Alex Sandro|D|Brasil|a|3|Santos,Oporto,Juventus,Flamengo
Estêvão|F|Brasil|a|2|Palmeiras,Chelsea
João Pedro|F|Brasil|a|2|Fluminense,Watford,Brighton,Chelsea
Bremer|D|Brasil|a|3|Atlético Mineiro,Torino,Juventus
Pelé|F|Brasil|l|1|Santos,New York Cosmos
Cafu|D|Brasil|l|1|São Paulo,Zaragoza,Roma,Milan
Adriano|F|Brasil|l|1|Flamengo,Inter,Parma,Roma
Alexandre Pato|F|Brasil|l|2|Internacional,Milan,Corinthians,Chelsea,Villarreal
Juninho Pernambucano|M|Brasil|l|2|Vasco da Gama,Lyon
Zico|M|Brasil|l|2|Flamengo,Udinese
Sócrates|M|Brasil|l|3|Corinthians,Fiorentina
Dida|P|Brasil|l|2|Cruzeiro,Corinthians,Milan
Júlio César|P|Brasil|l|2|Flamengo,Inter,QPR,Benfica
Lúcio|D|Brasil|l|2|Internacional,Leverkusen,Bayern,Inter,Juventus
Maicon|D|Brasil|l|2|Mónaco,Inter,Manchester City,Roma
Emerson|M|Brasil|l|3|Grêmio,Leverkusen,Roma,Juventus,Real Madrid,Milan
Edmílson|D|Brasil|l|3|São Paulo,Lyon,Barcelona,Villarreal
Juliano Belletti|D|Brasil|l|3|Villarreal,Barcelona,Chelsea
Anderson|M|Brasil|l|3|Grêmio,Oporto,Manchester United
Diego Ribas|M|Brasil|l|3|Santos,Oporto,Werder Bremen,Juventus,Wolfsburg,Atlético
David Luiz|D|Brasil|l|1|Benfica,Chelsea,PSG,Arsenal,Flamengo
Oscar|M|Brasil|l|3|Internacional,Chelsea,Shanghai SIPG
Lucas Moura|F|Brasil|l|3|São Paulo,PSG,Tottenham

# ---------- Uruguay · Colombia · Chile · resto de Sudamérica ----------
Edinson Cavani|F|Uruguay|a|1|Danubio,Palermo,Napoli,PSG,Manchester United,Valencia,Boca Juniors
Darwin Núñez|F|Uruguay|a|1|Peñarol,Almería,Benfica,Liverpool,Al-Hilal
Rodrigo Bentancur|M|Uruguay|a|2|Boca Juniors,Juventus,Tottenham
Manuel Ugarte|M|Uruguay|a|3|Famalicão,Sporting,PSG,Manchester United
Lucas Torreira|M|Uruguay|a|3|Sampdoria,Arsenal,Atlético,Fiorentina,Galatasaray
Fernando Muslera|P|Uruguay|l|3|Montevideo Wanderers,Lazio,Galatasaray
Álvaro Recoba|M|Uruguay|l|2|Nacional,Inter,Venezia
Enzo Francescoli|F|Uruguay|l|2|River Plate,Marsella,Cagliari,Torino
Paolo Montero|D|Uruguay|l|3|Peñarol,Atalanta,Juventus
Luis Díaz|F|Colombia|a|1|Junior,Oporto,Liverpool,Bayern
Juan Cuadrado|D|Colombia|a|2|Udinese,Fiorentina,Chelsea,Juventus,Inter
Davinson Sánchez|D|Colombia|a|3|Atlético Nacional,Ajax,Tottenham,Galatasaray
Yerry Mina|D|Colombia|a|3|Palmeiras,Barcelona,Everton,Cagliari
Luis Muriel|F|Colombia|a|3|Udinese,Sampdoria,Sevilla,Atalanta
Duván Zapata|F|Colombia|a|3|Napoli,Sampdoria,Atalanta,Torino
Jackson Martínez|F|Colombia|l|3|Oporto,Atlético
David Ospina|P|Colombia|l|3|Atlético Nacional,Niza,Arsenal,Napoli
René Higuita|P|Colombia|l|2|Atlético Nacional,Valladolid
Carlos Valderrama|M|Colombia|l|2|Montpellier,Valladolid
Faustino Asprilla|F|Colombia|l|2|Parma,Newcastle
Mario Yepes|D|Colombia|l|3|River Plate,PSG,Milan
Marcelo Salas|F|Chile|l|2|River Plate,Lazio,Juventus
Gary Medel|M|Chile|l|3|Boca Juniors,Sevilla,Cardiff,Inter
José Luis Chilavert|P|Paraguay|l|2|Zaragoza,Vélez,Estrasburgo
Óscar Cardozo|F|Paraguay|l|3|Newell's,Benfica,Trabzonspor
Miguel Almirón|M|Paraguay|a|3|Cerro Porteño,Atlanta United,Newcastle
Moisés Caicedo|M|Ecuador|a|1|Independiente del Valle,Brighton,Chelsea
Piero Hincapié|D|Ecuador|a|2|Talleres,Leverkusen,Arsenal
Pervis Estupiñán|D|Ecuador|a|2|Watford,Villarreal,Brighton,Milan
Willian Pacho|D|Ecuador|a|3|Amberes,Eintracht,PSG
Enner Valencia|F|Ecuador|a|3|Pachuca,West Ham,Fenerbahçe,Internacional
Antonio Valencia|M|Ecuador|l|2|Villarreal,Wigan,Manchester United
Claudio Pizarro|F|Perú|l|2|Werder Bremen,Bayern,Chelsea
Paolo Guerrero|F|Perú|l|3|Bayern,Hamburgo,Corinthians,Flamengo
Jefferson Farfán|F|Perú|l|3|PSV,Schalke
Yangel Herrera|M|Venezuela|a|3|Manchester City,Huesca,Granada,Girona
Javier Hernández|F|México|l|1|Chivas,Manchester United,Real Madrid,Leverkusen,West Ham,Sevilla
Raúl Jiménez|F|México|a|2|América,Atlético,Benfica,Wolves,Fulham
Hirving Lozano|F|México|a|2|Pachuca,PSV,Napoli
Guillermo Ochoa|P|México|a|3|América,Ajaccio,Málaga,Standard Lieja,Salernitana
Santiago Giménez|F|México|a|2|Cruz Azul,Feyenoord,Milan
Jorge Campos|P|México|l|3|Pumas,LA Galaxy

# ---------- Cracks del resto de Europa (los de la portada del FIFA) ----------
Erling Haaland|F|Noruega|a|1|Molde,Salzburgo,Dortmund,Manchester City
Harry Kane|F|Inglaterra|a|1|Tottenham,Bayern
Mohamed Salah|F|Egipto|a|1|Basilea,Chelsea,Fiorentina,Roma,Liverpool
Kevin De Bruyne|M|Bélgica|a|1|Genk,Chelsea,Wolfsburg,Manchester City,Napoli
Phil Foden|M|Inglaterra|a|1|Manchester City
Bukayo Saka|F|Inglaterra|a|1|Arsenal
Declan Rice|M|Inglaterra|a|1|West Ham,Arsenal
Cole Palmer|M|Inglaterra|a|1|Manchester City,Chelsea
Jack Grealish|M|Inglaterra|a|2|Aston Villa,Manchester City,Everton
Virgil van Dijk|D|Países Bajos|a|1|Groningen,Celtic,Southampton,Liverpool
Bruno Fernandes|M|Portugal|a|1|Udinese,Sampdoria,Sporting,Manchester United
Bernardo Silva|M|Portugal|a|1|Benfica,Mónaco,Manchester City
Rúben Dias|D|Portugal|a|2|Benfica,Manchester City
Rafael Leão|F|Portugal|a|1|Sporting,Lille,Milan
Vitinha|M|Portugal|a|2|Oporto,Wolves,PSG
Nuno Mendes|D|Portugal|a|2|Sporting,PSG
João Neves|M|Portugal|a|2|Benfica,PSG
Jamal Musiala|M|Alemania|a|1|Bayern
Florian Wirtz|M|Alemania|a|1|Leverkusen,Liverpool
Joshua Kimmich|M|Alemania|a|1|Leipzig,Bayern
Thomas Müller|F|Alemania|a|1|Bayern,Vancouver Whitecaps
Manuel Neuer|P|Alemania|a|1|Schalke,Bayern
Leroy Sané|F|Alemania|a|2|Schalke,Manchester City,Bayern,Galatasaray
Kai Havertz|F|Alemania|a|2|Leverkusen,Chelsea,Arsenal
Michael Olise|F|Francia|a|2|Reading,Crystal Palace,Bayern
Désiré Doué|F|Francia|a|2|Rennes,PSG
William Saliba|D|Francia|a|2|Saint-Étienne,Marsella,Arsenal
Mike Maignan|P|Francia|a|2|PSG,Lille,Milan
Marcus Thuram|F|Francia|a|2|Guingamp,Borussia Mönchengladbach,Inter
N'Golo Kanté|M|Francia|a|1|Caen,Leicester,Chelsea,Al-Ittihad
Paul Pogba|M|Francia|a|1|Manchester United,Juventus,Mónaco
Olivier Giroud|F|Francia|a|2|Montpellier,Arsenal,Chelsea,Milan,LAFC,Lille
Khvicha Kvaratskhelia|F|Georgia|a|1|Rubin Kazan,Napoli,PSG
Victor Osimhen|F|Nigeria|a|2|Wolfsburg,Lille,Napoli,Galatasaray
Nicolò Barella|M|Italia|a|2|Cagliari,Inter
Gianluigi Donnarumma|P|Italia|a|1|Milan,PSG,Manchester City
Son Heung-min|F|Corea del Sur|a|1|Hamburgo,Leverkusen,Tottenham,LAFC
Romelu Lukaku|F|Bélgica|a|1|Anderlecht,Chelsea,Everton,Manchester United,Inter,Roma,Napoli
Viktor Gyökeres|F|Suecia|a|2|Brighton,Coventry,Sporting,Arsenal
Dušan Vlahović|F|Serbia|a|2|Partizan,Fiorentina,Juventus
Sadio Mané|F|Senegal|a|1|Metz,Salzburgo,Southampton,Liverpool,Bayern,Al-Nassr
Riyad Mahrez|F|Argelia|a|2|Le Havre,Leicester,Manchester City,Al-Ahli
Hakan Çalhanoğlu|M|Turquía|a|2|Hamburgo,Leverkusen,Milan,Inter
Christian Pulisic|F|Estados Unidos|a|2|Dortmund,Chelsea,Milan
Kenan Yıldız|F|Turquía|a|3|Bayern,Juventus
Xavi Simons|M|Países Bajos|a|2|Barcelona,PSG,PSV,Leipzig,Tottenham
Cody Gakpo|F|Países Bajos|a|2|PSV,Liverpool
Matthijs de Ligt|D|Países Bajos|a|2|Ajax,Juventus,Bayern,Manchester United
Paolo Maldini|D|Italia|l|1|Milan
Andrea Pirlo|M|Italia|l|1|Brescia,Inter,Milan,Juventus
Francesco Totti|F|Italia|l|1|Roma
Alessandro Del Piero|F|Italia|l|1|Padova,Juventus,Sydney FC
Gianluigi Buffon|P|Italia|l|1|Parma,Juventus,PSG
Roberto Baggio|F|Italia|l|1|Fiorentina,Juventus,Milan,Inter,Brescia
Alessandro Nesta|D|Italia|l|2|Lazio,Milan
Gennaro Gattuso|M|Italia|l|2|Perugia,Rangers,Milan
Filippo Inzaghi|F|Italia|l|2|Parma,Atalanta,Juventus,Milan
Christian Vieri|F|Italia|l|2|Juventus,Atlético,Lazio,Inter,Milan
Daniele De Rossi|M|Italia|l|2|Roma,Boca Juniors
Giorgio Chiellini|D|Italia|l|2|Fiorentina,Juventus,LAFC
Marco Materazzi|D|Italia|l|3|Perugia,Everton,Inter
Patrick Vieira|M|Francia|l|1|Cannes,Milan,Arsenal,Juventus,Inter,Manchester City
Franck Ribéry|F|Francia|l|1|Galatasaray,Marsella,Bayern,Fiorentina
Didier Drogba|F|Costa de Marfil|l|1|Guingamp,Marsella,Chelsea,Galatasaray
Frank Lampard|M|Inglaterra|l|1|West Ham,Chelsea,Manchester City
Steven Gerrard|M|Inglaterra|l|1|Liverpool,LA Galaxy
Wayne Rooney|F|Inglaterra|l|1|Everton,Manchester United,DC United
Paul Scholes|M|Inglaterra|l|2|Manchester United
John Terry|D|Inglaterra|l|1|Chelsea,Aston Villa
Rio Ferdinand|D|Inglaterra|l|2|West Ham,Leeds,Manchester United
Petr Čech|P|Chequia|l|2|Rennes,Chelsea,Arsenal
Andriy Shevchenko|F|Ucrania|l|1|Dinamo Kiev,Milan,Chelsea
Pavel Nedvěd|M|Chequia|l|2|Sparta Praga,Lazio,Juventus
Rui Costa|M|Portugal|l|2|Benfica,Fiorentina,Milan
Michael Ballack|M|Alemania|l|2|Kaiserslautern,Leverkusen,Bayern,Chelsea
Miroslav Klose|F|Alemania|l|2|Kaiserslautern,Werder Bremen,Bayern,Lazio
Philipp Lahm|D|Alemania|l|2|Stuttgart,Bayern
Bastian Schweinsteiger|M|Alemania|l|2|Bayern,Manchester United,Chicago Fire
Oliver Kahn|P|Alemania|l|2|Karlsruhe,Bayern
Marco Reus|F|Alemania|l|2|Borussia Mönchengladbach,Dortmund,LA Galaxy
Dennis Bergkamp|F|Países Bajos|l|2|Ajax,Inter,Arsenal
Clarence Seedorf|M|Países Bajos|l|2|Ajax,Sampdoria,Real Madrid,Inter,Milan
Edgar Davids|M|Países Bajos|l|3|Ajax,Milan,Juventus,Barcelona,Inter,Tottenham
Marco van Basten|F|Países Bajos|l|2|Ajax,Milan
Robin van Persie|F|Países Bajos|l|2|Feyenoord,Arsenal,Manchester United,Fenerbahçe
Ruud Gullit|M|Países Bajos|l|2|Feyenoord,PSV,Milan,Sampdoria,Chelsea
George Weah|F|Liberia|l|2|Mónaco,PSG,Milan,Chelsea
Eric Cantona|F|Francia|l|2|Marsella,Leeds,Manchester United
Ryan Giggs|M|Gales|l|2|Manchester United
Peter Schmeichel|P|Dinamarca|l|3|Brøndby,Manchester United,Sporting
Franz Beckenbauer|D|Alemania|l|2|Bayern,New York Cosmos
Eusébio|F|Portugal|l|3|Benfica
Michel Platini|M|Francia|l|2|Nancy,Saint-Étienne,Juventus
`;

/* ---------------- parsing ---------------- */
export const PLAYERS = [];
const seen = new Set();
for (const line of RAW.split("\n")) {
  const l = line.trim();
  if (!l || l.startsWith("#")) continue;
  const [name, pos, country, era, lvl, clubs = ""] = l.split("|");
  if (seen.has(name)) continue; // por si se cuela un duplicado
  seen.add(name);
  PLAYERS.push({ name, pos, country, era, lvl: Number(lvl) || 2, clubs: clubs.split(",").map((c) => c.trim()).filter(Boolean) });
}
export const BY_NAME = new Map(PLAYERS.map((p) => [p.name, p]));

export const POS_LABEL = { P: "Portero", D: "Defensa", M: "Centrocampista", F: "Delantero" };
export const POS_SHORT = { P: "POR", D: "DEF", M: "MED", F: "DEL" };

const LALIGA = new Set([
  "Real Madrid", "Barcelona", "Atlético", "Sevilla", "Valencia", "Villarreal", "Real Sociedad", "Athletic",
  "Betis", "Celta", "Espanyol", "Deportivo", "Getafe", "Osasuna", "Málaga", "Mallorca", "Rayo", "Girona",
  "Valladolid", "Zaragoza", "Racing", "Alavés", "Levante", "Granada", "Las Palmas", "Almería", "Elche",
  "Sporting", "Tenerife", "Cádiz", "Recreativo", "Leganés", "Eibar", "Huesca", "Oviedo",
]);
// "Sporting" de Lisboa se escribe igual que el de Gijón: solo cuenta como LaLiga si es español.
export const isLiga = (p) => p.clubs.some((c) => LALIGA.has(c) && !(c === "Sporting" && p.country !== "España"));
const SUDAMERICA = new Set(["Argentina", "Brasil", "Uruguay", "Colombia", "Chile", "Paraguay", "Ecuador", "Perú", "Venezuela", "Bolivia"]);
const isSud = (p) => SUDAMERICA.has(p.country);

/* ---------------- bombos ---------------- */
export const POOL_OPTS = [["all", "Todos"], ["liga", "LaLiga"], ["sud", "Sudamérica"]];
export const ERA_OPTS = [["all", "Todas"], ["a", "Actuales"], ["l", "Leyendas"]];
export const LEVEL_OPTS = [[1, "Fácil"], [2, "Normal"], [3, "Friki"]];
export const HINT_OPTS = [["none", "No"], ["random", "Sí"]];

const match = (p, s) =>
  (s.pool === "liga" ? isLiga(p) : s.pool === "sud" ? isSud(p) : true) &&
  (s.era === "a" || s.era === "l" ? p.era === s.era : true) &&
  p.lvl <= (Number(s.level) || 3);

const cache = new Map();
/** Lista de futbolistas para unos ajustes. Si el filtro deja muy pocos, se relaja el nivel. */
export function buildPool(s) {
  const key = `${s.pool}|${s.era}|${s.level}`;
  if (cache.has(key)) return cache.get(key);
  let list = PLAYERS.filter((p) => match(p, s));
  if (list.length < 12) list = PLAYERS.filter((p) => match(p, { ...s, level: 3 }));
  if (list.length < 12) list = PLAYERS;
  cache.set(key, list);
  return list;
}

/* ---------------- banderas ---------------- */
const ISO = {
  "España": "ES", "Argentina": "AR", "Brasil": "BR", "Uruguay": "UY", "Colombia": "CO", "Chile": "CL",
  "Paraguay": "PY", "Ecuador": "EC", "Venezuela": "VE", "Perú": "PE", "Bolivia": "BO", "México": "MX",
  "Costa Rica": "CR", "Francia": "FR", "Portugal": "PT", "Alemania": "DE", "Italia": "IT",
  "Países Bajos": "NL", "Bélgica": "BE", "Croacia": "HR", "Polonia": "PL", "Noruega": "NO", "Suecia": "SE",
  "Egipto": "EG", "Marruecos": "MA", "Japón": "JP", "Turquía": "TR", "Ucrania": "UA", "Eslovenia": "SI",
  "Georgia": "GE", "Nigeria": "NG", "Ghana": "GH", "Senegal": "SN", "Argelia": "DZ", "Camerún": "CM",
  "Costa de Marfil": "CI", "Malí": "ML", "Gabón": "GA", "Corea del Sur": "KR", "Estados Unidos": "US",
  "Serbia": "RS", "Bosnia y Herzegovina": "BA", "Rusia": "RU", "Bulgaria": "BG", "Dinamarca": "DK",
  "Chequia": "CZ", "Hungría": "HU", "Rumanía": "RO", "Liberia": "LR", "Kosovo": "XK", "China": "CN",
  "Austria": "AT",
};
const SUBDIV = { "Inglaterra": "gbeng", "Gales": "gbwls", "Escocia": "gbsct" };
export function flag(country) {
  if (SUBDIV[country]) return "\u{1F3F4}" + [...SUBDIV[country]].map((c) => String.fromCodePoint(0xe0000 + c.charCodeAt(0))).join("") + "\u{E007F}";
  const iso = ISO[country];
  return iso ? [...iso].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join("") : "🏳️";
}
