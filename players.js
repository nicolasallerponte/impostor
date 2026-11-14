// Formato: Nombre|Posición (P,D,M,F)|País|Época (a = actual, l = leyenda)
const RAW = `
Lionel Messi|F|Argentina|a
Cristiano Ronaldo|F|Portugal|a
Kylian Mbappé|F|Francia|a
Erling Haaland|F|Noruega|a
Vinícius Júnior|F|Brasil|a
Lamine Yamal|F|España|a
Mohamed Salah|F|Egipto|a
Harry Kane|F|Inglaterra|a
Robert Lewandowski|F|Polonia|a
Raphinha|F|Brasil|a
Rodrygo|F|Brasil|a
Neymar|F|Brasil|a
Karim Benzema|F|Francia|a
Antoine Griezmann|F|Francia|a
Julián Álvarez|F|Argentina|a
Lautaro Martínez|F|Argentina|a
Bukayo Saka|F|Inglaterra|a
Ousmane Dembélé|F|Francia|a
Khvicha Kvaratskhelia|F|Georgia|a
Victor Osimhen|F|Nigeria|a
Rafael Leão|F|Portugal|a
Son Heung-min|F|Corea del Sur|a
Marcus Rashford|F|Inglaterra|a
Nico Williams|F|España|a
Iñaki Williams|F|Ghana|a
Álvaro Morata|F|España|a
Ferran Torres|F|España|a
Mikel Oyarzabal|F|España|a
Paulo Dybala|F|Argentina|a
Ángel Di María|F|Argentina|a
Luis Suárez|F|Uruguay|a
Darwin Núñez|F|Uruguay|a
Edinson Cavani|F|Uruguay|a
Alexander Isak|F|Suecia|a
Viktor Gyökeres|F|Suecia|a
Leroy Sané|F|Alemania|a
Kai Havertz|F|Alemania|a
Thomas Müller|F|Alemania|a
Romelu Lukaku|F|Bélgica|a
Jérémy Doku|F|Bélgica|a
Christian Pulisic|F|Estados Unidos|a
Federico Chiesa|F|Italia|a
Ciro Immobile|F|Italia|a
Dušan Vlahović|F|Serbia|a
Marcus Thuram|F|Francia|a
Michael Olise|F|Francia|a
Désiré Doué|F|Francia|a
Hugo Ekitike|F|Francia|a
Olivier Giroud|F|Francia|a
Kingsley Coman|F|Francia|a
Kenan Yıldız|F|Turquía|a
Luis Díaz|F|Colombia|a
Cody Gakpo|F|Países Bajos|a
Memphis Depay|F|Países Bajos|a
Sadio Mané|F|Senegal|a
Riyad Mahrez|F|Argelia|a
Raúl Jiménez|F|México|a
Hirving Lozano|F|México|a
Gabriel Martinelli|F|Brasil|a
Endrick|F|Brasil|a
Estêvão|F|Brasil|a
Hulk|F|Brasil|a
João Pedro|F|Brasil|a
Matheus Cunha|F|Brasil|a
Ademola Lookman|F|Nigeria|a
Mohammed Kudus|F|Ghana|a
Jack Grealish|F|Inglaterra|a
Jamie Vardy|F|Inglaterra|a
Kaoru Mitoma|F|Japón|a
Takefusa Kubo|F|Japón|a
Pierre-Emerick Aubameyang|F|Gabón|a
Alexis Sánchez|F|Chile|a
Edin Džeko|F|Bosnia y Herzegovina|a
Iago Aspas|F|España|a
Ansu Fati|F|España|a
Alejandro Garnacho|F|Argentina|a
Omar Marmoush|F|Egipto|a
Bryan Mbeumo|F|Camerún|a
Alexander Sørloth|F|Noruega|a
Brahim Díaz|F|Marruecos|a
Kevin De Bruyne|M|Bélgica|a
Luka Modrić|M|Croacia|a
Jude Bellingham|M|Inglaterra|a
Pedri|M|España|a
Gavi|M|España|a
Rodri|M|España|a
Frenkie de Jong|M|Países Bajos|a
Federico Valverde|M|Uruguay|a
Eduardo Camavinga|M|Francia|a
Aurélien Tchouaméni|M|Francia|a
Declan Rice|M|Inglaterra|a
Martin Ødegaard|M|Noruega|a
Bruno Fernandes|M|Portugal|a
Bernardo Silva|M|Portugal|a
Joshua Kimmich|M|Alemania|a
Jamal Musiala|M|Alemania|a
Florian Wirtz|M|Alemania|a
İlkay Gündoğan|M|Alemania|a
Mario Götze|M|Alemania|a
Nicolò Barella|M|Italia|a
Marco Verratti|M|Italia|a
Enzo Fernández|M|Argentina|a
Alexis Mac Allister|M|Argentina|a
Rodrigo De Paul|M|Argentina|a
Leandro Paredes|M|Argentina|a
Nico Paz|M|Argentina|a
Franco Mastantuono|M|Argentina|a
Casemiro|M|Brasil|a
Bruno Guimarães|M|Brasil|a
Philippe Coutinho|M|Brasil|a
Dani Olmo|M|España|a
Fermín López|M|España|a
Mikel Merino|M|España|a
Martín Zubimendi|M|España|a
Fabián Ruiz|M|España|a
Koke|M|España|a
Isco|M|España|a
Santi Cazorla|M|España|a
Álex Baena|M|España|a
Dani Ceballos|M|España|a
Marcos Llorente|M|España|a
Vitinha|M|Portugal|a
João Neves|M|Portugal|a
Warren Zaïre-Emery|M|Francia|a
N'Golo Kanté|M|Francia|a
Hakan Çalhanoğlu|M|Turquía|a
Arda Güler|M|Turquía|a
Cole Palmer|M|Inglaterra|a
Phil Foden|M|Inglaterra|a
Moisés Caicedo|M|Ecuador|a
Granit Xhaka|M|Suiza|a
Sergej Milinković-Savić|M|Serbia|a
Dominik Szoboszlai|M|Hungría|a
Tijjani Reijnders|M|Países Bajos|a
James Rodríguez|M|Colombia|a
Arturo Vidal|M|Chile|a
Virgil van Dijk|D|Países Bajos|a
Rúben Dias|D|Portugal|a
Antonio Rüdiger|D|Alemania|a
Éder Militão|D|Brasil|a
Marquinhos|D|Brasil|a
Gabriel Magalhães|D|Brasil|a
Achraf Hakimi|D|Marruecos|a
Trent Alexander-Arnold|D|Inglaterra|a
Kyle Walker|D|Inglaterra|a
Andrew Robertson|D|Escocia|a
Theo Hernández|D|Francia|a
William Saliba|D|Francia|a
Jules Koundé|D|Francia|a
Dayot Upamecano|D|Francia|a
Joško Gvardiol|D|Croacia|a
Ronald Araujo|D|Uruguay|a
José María Giménez|D|Uruguay|a
Alejandro Balde|D|España|a
Pau Cubarsí|D|España|a
Dani Carvajal|D|España|a
Dean Huijsen|D|España|a
Marc Cucurella|D|España|a
Aymeric Laporte|D|España|a
Robin Le Normand|D|España|a
Eric García|D|España|a
Álvaro Carreras|D|España|a
Alphonso Davies|D|Canadá|a
João Cancelo|D|Portugal|a
Nuno Mendes|D|Portugal|a
Kim Min-jae|D|Corea del Sur|a
Cristian Romero|D|Argentina|a
Lisandro Martínez|D|Argentina|a
Nicolás Otamendi|D|Argentina|a
Alessandro Bastoni|D|Italia|a
Federico Dimarco|D|Italia|a
Kalidou Koulibaly|D|Senegal|a
Jeremie Frimpong|D|Países Bajos|a
David Alaba|D|Austria|a
Thibaut Courtois|P|Bélgica|a
Marc-André ter Stegen|P|Alemania|a
Manuel Neuer|P|Alemania|a
Alisson Becker|P|Brasil|a
Ederson|P|Brasil|a
Jan Oblak|P|Eslovenia|a
Gianluigi Donnarumma|P|Italia|a
Emiliano "Dibu" Martínez|P|Argentina|a
Unai Simón|P|España|a
David Raya|P|España|a
Joan García|P|España|a
David de Gea|P|España|a
Mike Maignan|P|Francia|a
Hugo Lloris|P|Francia|a
André Onana|P|Camerún|a
Yassine Bounou|P|Marruecos|a
Gregor Kobel|P|Suiza|a
Diogo Costa|P|Portugal|a
Wojciech Szczęsny|P|Polonia|a
Keylor Navas|P|Costa Rica|a
Pelé|F|Brasil|l
Diego Maradona|M|Argentina|l
Johan Cruyff|F|Países Bajos|l
Alfredo Di Stéfano|F|Argentina|l
Ferenc Puskás|F|Hungría|l
Eusébio|F|Portugal|l
Garrincha|F|Brasil|l
Gerd Müller|F|Alemania|l
Ronaldo Nazário|F|Brasil|l
Romário|F|Brasil|l
Bebeto|F|Brasil|l
Adriano|F|Brasil|l
Thierry Henry|F|Francia|l
David Trezeguet|F|Francia|l
Jean-Pierre Papin|F|Francia|l
Eric Cantona|F|Francia|l
Franck Ribéry|F|Francia|l
Marco van Basten|F|Países Bajos|l
Dennis Bergkamp|F|Países Bajos|l
Ruud van Nistelrooy|F|Países Bajos|l
Robin van Persie|F|Países Bajos|l
Arjen Robben|F|Países Bajos|l
Patrick Kluivert|F|Países Bajos|l
Miroslav Klose|F|Alemania|l
Jürgen Klinsmann|F|Alemania|l
Karl-Heinz Rummenigge|F|Alemania|l
Lukas Podolski|F|Alemania|l
Raúl González|F|España|l
Fernando Torres|F|España|l
David Villa|F|España|l
Fernando Morientes|F|España|l
Emilio Butragueño|F|España|l
Aritz Aduriz|F|España|l
Diego Costa|F|España|l
Hugo Sánchez|F|México|l
Javier "Chicharito" Hernández|F|México|l
Cuauhtémoc Blanco|F|México|l
Gabriel Batistuta|F|Argentina|l
Hernán Crespo|F|Argentina|l
Carlos Tevez|F|Argentina|l
Sergio Agüero|F|Argentina|l
Gonzalo Higuaín|F|Argentina|l
Mario Kempes|F|Argentina|l
Claudio Caniggia|F|Argentina|l
Diego Forlán|F|Uruguay|l
Enzo Francescoli|F|Uruguay|l
Francesco Totti|F|Italia|l
Alessandro Del Piero|F|Italia|l
Roberto Baggio|F|Italia|l
Christian Vieri|F|Italia|l
Filippo Inzaghi|F|Italia|l
Paolo Rossi|F|Italia|l
Andriy Shevchenko|F|Ucrania|l
George Weah|F|Liberia|l
Samuel Eto'o|F|Camerún|l
Didier Drogba|F|Costa de Marfil|l
Wayne Rooney|F|Inglaterra|l
Alan Shearer|F|Inglaterra|l
Gary Lineker|F|Inglaterra|l
Michael Owen|F|Inglaterra|l
Zlatan Ibrahimović|F|Suecia|l
Hristo Stoichkov|F|Bulgaria|l
Dimitar Berbatov|F|Bulgaria|l
Davor Šuker|F|Croacia|l
Radamel Falcao|F|Colombia|l
Iván Zamorano|F|Chile|l
Marcelo Salas|F|Chile|l
Eden Hazard|F|Bélgica|l
Gareth Bale|F|Gales|l
Ricardo Quaresma|F|Portugal|l
Landon Donovan|F|Estados Unidos|l
Zinedine Zidane|M|Francia|l
Michel Platini|M|Francia|l
Patrick Vieira|M|Francia|l
Claude Makélélé|M|Francia|l
Didier Deschamps|M|Francia|l
Robert Pires|M|Francia|l
Xavi Hernández|M|España|l
Andrés Iniesta|M|España|l
Sergio Busquets|M|España|l
Xabi Alonso|M|España|l
Cesc Fàbregas|M|España|l
David Silva|M|España|l
Pep Guardiola|M|España|l
Guti|M|España|l
Joaquín|M|España|l
Gaizka Mendieta|M|España|l
Marcos Senna|M|España|l
Andrea Pirlo|M|Italia|l
Gennaro Gattuso|M|Italia|l
Daniele De Rossi|M|Italia|l
Steven Gerrard|M|Inglaterra|l
Frank Lampard|M|Inglaterra|l
Paul Scholes|M|Inglaterra|l
David Beckham|M|Inglaterra|l
Paul Gascoigne|M|Inglaterra|l
Bobby Charlton|M|Inglaterra|l
Ryan Giggs|M|Gales|l
Roy Keane|M|Irlanda|l
Toni Kroos|M|Alemania|l
Bastian Schweinsteiger|M|Alemania|l
Michael Ballack|M|Alemania|l
Lothar Matthäus|M|Alemania|l
Mesut Özil|M|Alemania|l
Clarence Seedorf|M|Países Bajos|l
Edgar Davids|M|Países Bajos|l
Wesley Sneijder|M|Países Bajos|l
Ruud Gullit|M|Países Bajos|l
Frank Rijkaard|M|Países Bajos|l
Kaká|M|Brasil|l
Ronaldinho|M|Brasil|l
Rivaldo|M|Brasil|l
Zico|M|Brasil|l
Sócrates|M|Brasil|l
Juninho Pernambucano|M|Brasil|l
Juan Román Riquelme|M|Argentina|l
Pablo Aimar|M|Argentina|l
Javier Mascherano|M|Argentina|l
Juan Sebastián Verón|M|Argentina|l
Fernando Redondo|M|Argentina|l
Pavel Nedvěd|M|Chequia|l
Luís Figo|M|Portugal|l
Rui Costa|M|Portugal|l
Deco|M|Portugal|l
Michael Laudrup|M|Dinamarca|l
Gheorghe Hagi|M|Rumanía|l
Carlos Valderrama|M|Colombia|l
Jay-Jay Okocha|M|Nigeria|l
Yaya Touré|M|Costa de Marfil|l
Michael Essien|M|Ghana|l
Hidetoshi Nakata|M|Japón|l
Park Ji-sung|M|Corea del Sur|l
Paolo Maldini|D|Italia|l
Franco Baresi|D|Italia|l
Fabio Cannavaro|D|Italia|l
Alessandro Nesta|D|Italia|l
Giorgio Chiellini|D|Italia|l
Leonardo Bonucci|D|Italia|l
Giacinto Facchetti|D|Italia|l
Carles Puyol|D|España|l
Sergio Ramos|D|España|l
Gerard Piqué|D|España|l
Fernando Hierro|D|España|l
Jordi Alba|D|España|l
Jesús Navas|D|España|l
Míchel Salgado|D|España|l
Roberto Carlos|D|Brasil|l
Cafu|D|Brasil|l
Marcelo|D|Brasil|l
Lúcio|D|Brasil|l
Carlos Alberto|D|Brasil|l
Thiago Silva|D|Brasil|l
Franz Beckenbauer|D|Alemania|l
Philipp Lahm|D|Alemania|l
Paul Breitner|D|Alemania|l
Mats Hummels|D|Alemania|l
Javier Zanetti|D|Argentina|l
Daniel Passarella|D|Argentina|l
Walter Samuel|D|Argentina|l
Juan Pablo Sorín|D|Argentina|l
John Terry|D|Inglaterra|l
Rio Ferdinand|D|Inglaterra|l
Ashley Cole|D|Inglaterra|l
Gary Neville|D|Inglaterra|l
Bobby Moore|D|Inglaterra|l
Lilian Thuram|D|Francia|l
Marcel Desailly|D|Francia|l
Laurent Blanc|D|Francia|l
Patrice Evra|D|Francia|l
Raphaël Varane|D|Francia|l
Nemanja Vidić|D|Serbia|l
Jaap Stam|D|Países Bajos|l
Ronald Koeman|D|Países Bajos|l
Pepe|D|Portugal|l
Diego Godín|D|Uruguay|l
Rafael Márquez|D|México|l
Iker Casillas|P|España|l
Víctor Valdés|P|España|l
Andoni Zubizarreta|P|España|l
Santiago Cañizares|P|España|l
Gianluigi Buffon|P|Italia|l
Dino Zoff|P|Italia|l
Oliver Kahn|P|Alemania|l
Peter Schmeichel|P|Dinamarca|l
Lev Yashin|P|Unión Soviética|l
Edwin van der Sar|P|Países Bajos|l
Petr Čech|P|Chequia|l
Fabien Barthez|P|Francia|l
Gordon Banks|P|Inglaterra|l
José Luis Chilavert|P|Paraguay|l
Jorge Campos|P|México|l
René Higuita|P|Colombia|l
Sergio Goycochea|P|Argentina|l
Rogério Ceni|P|Brasil|l
Júlio César|P|Brasil|l
Dida|P|Brasil|l
Claudio Bravo|P|Chile|l
`;

export const POS_LABEL = { P: "Portero", D: "Defensa", M: "Centrocampista", F: "Delantero" };

export const PLAYERS = RAW.trim().split("\n").map((l) => {
  const [name, pos, country, era] = l.split("|");
  return { name, pos, country, era };
});

export const POOLS = {
  all: { label: "Todos", list: PLAYERS },
  now: { label: "Actuales", list: PLAYERS.filter((p) => p.era === "a") },
  old: { label: "Leyendas", list: PLAYERS.filter((p) => p.era === "l") },
};
