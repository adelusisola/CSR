// Seed data generator — Module 0 DONE WHEN: "seed data present" (3 NGOs, 2 companies,
// 1 admin, all 36 states + FCT with LGAs, match_adjacency).
// Outputs a plain-JSON manifest for import and is unit-tested; the SQL seed file
// (supabase/seed.sql) carries the same data for `supabase db reset`.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const SECTOR_TAXONOMY = [
  "Education",
  "Health",
  "Water & Sanitation",
  "Food Security & Agriculture",
  "Youth Empowerment & Skills",
  "Environment & Climate",
  "Women & Girls",
  "Disability Inclusion",
  "Community Safety",
  "Arts, Culture & Heritage",
] as const;

// Section 9 adjacency: each sector pairs with its listed neighbours (symmetric).
const ADJACENCY_PAIRS: [string, string][] = [
  ["Education", "Youth Empowerment & Skills"],
  ["Education", "Women & Girls"],
  ["Education", "Disability Inclusion"],
  ["Education", "Arts, Culture & Heritage"],
  ["Health", "Water & Sanitation"],
  ["Health", "Food Security & Agriculture"],
  ["Health", "Women & Girls"],
  ["Health", "Community Safety"],
  ["Water & Sanitation", "Environment & Climate"],
  ["Water & Sanitation", "Food Security & Agriculture"],
  ["Food Security & Agriculture", "Environment & Climate"],
  ["Youth Empowerment & Skills", "Community Safety"],
  ["Youth Empowerment & Skills", "Environment & Climate"],
  ["Women & Girls", "Youth Empowerment & Skills"],
  ["Women & Girls", "Food Security & Agriculture"],
  ["Disability Inclusion", "Health"],
  ["Disability Inclusion", "Youth Empowerment & Skills"],
  ["Community Safety", "Environment & Climate"],
  ["Arts, Culture & Heritage", "Youth Empowerment & Skills"],
];

/** All 36 states + FCT with their official LGAs. */
export interface StateSeed { code: string; name: string; is_fct: boolean; lgas: string[] }

export const STATES: StateSeed[] = [
  { code: "LA", name: "Lagos", is_fct: false, lgas: ["Agege","Ajeromi-Ifelodun","Alimosho","Amuwo-Odofin","Apapa","Badagry","Epe","Eti-Osa","Ibeju-Lekki","Ifako-Ijaiye","Ikeja","Ikorodu","Kosofe","Lagos Island","Lagos Mainland","Mushin","Ojo","Oshodi-Isolo","Shomolu","Surulere"] },
  { code: "AB", name: "Abia", is_fct: false, lgas: ["Aba North","Aba South","Arochukwu","Bende","Ikwuano","Isiala Ngwa North","Isiala Ngwa South","Isiukwato","Obi Ngwa","Ohafia","Osisioma","Ugwunagbo","Ukwa East","Ukwa West","Umuahia North","Umuahia South","Umu Nneochi"] },
  { code: "AD", name: "Adamawa", is_fct: false, lgas: ["Demsa","Fufure","Ganye","Gayuk","Gombi","Grie","Hong","Jada","Lamurde","Madagali","Maiha","Mayo Belwa","Michika","Mubi North","Mubi South","Numan","Shelleng","Song","Toungo","Yola North","Yola South"] },
  { code: "AK", name: "Akwa Ibom", is_fct: false, lgas: ["Abak","Eastern Obolo","Eket","Esit Eket","Essien Udim","Etim Ekpo","Etinan","Ibeno","Ibesikpo Asutan","Ibiono-Ibom","Ika","Ikono","Ikot Abasi","Ikot Ekpene","Ini","Itu","Mbo","Mkpat-Enin","Nsit-Atai","Nsit-Ibom","Obot Akara","Okobo","Onna","Oron","Oruk Anam","Udung-Uko","Ukanafun","Uruan","Urue-Offong/Oruko","Uyo"] },
  { code: "AN", name: "Anambra", is_fct: false, lgas: ["Aguata","Anambra East","Anambra West","Anaocha","Awka North","Awka South","Ayamelum","Dunukofia","Ekwusigo","Idemili North","Idemili South","Ihiala","Njikoka","Nnewi North","Nnewi South","Ogbaru","Onyeka","Oka"] },
  { code: "BA", name: "Bauchi", is_fct: false, lgas: ["Alkalai","Ayu","Baram","Bogoro","Darazo","Dass","Gamaji","Garko","Gbalo","Giyo","Gombe","Gununu","Itas/Gadau","Jama'are","Katagum","Kirfi","Misau","Ningi","Shira","Tafan/Waka","Tudun Wada","Zaki","Zangon Kataf","Akko"] },
  { code: "BY", name: "Bayelsa", is_fct: false, lgas: ["Brass","Ekeremor","Kolokuma/Opokuma","Nembe","Ogbia","Sagbama","Southern Ijaw","Yenagoa"] },
  { code: "BC", name: "Benue", is_fct: false, lgas: ["Ado","Agatu","Apa","Buruku","Gboko","Guma","Gwer East","Gwer West","Katsina-Ala","Konshisha","Kwande","Logo","Makurdi","Obi","Ogbadibo","Ohimini","Oju","Okpokwu","Otukpo","Spvda","Tarka","Ukum","Ushongo","Vandeikya"] },
  { code: "BO", name: "Borno", is_fct: false, lgas: ["Abadam","Askira/Uba","Bama","Bayo","Biu","Chibok","Damboa","Dikwa","Gubio","Guzamala","Gwoza","Hawul","Jere","Kaga","Kala/Balge","Konduga","Kukawa","Kwaya Kusar","Mafa","Magumeri","Maiduguri","Marte","Mobbar","Monguno","Ngala","Nganzai","Shani"] },
  { code: "CR", name: "Cross River", is_fct: false, lgas: ["Abi","Akamkpa","Akpabuyo","Bakassi","Bekwarra","Birom","Calabar Municipal","Calabar South","Etung","Ikom","Obanliku","Obubra","Obudu","Odukpani","Ogoja","Yakuur","Yala"] },
  { code: "DE", name: "Delta", is_fct: false, lgas: ["Aniocha North","Aniocha South","Bomadi","Burutu","Ethiope East","Ethiope West","Ika North East","Ika South","Isoko North","Isoko South","Ndokwa East","Ndokwa West","Okpe","Oshimili North","Oshimili South","Patani","Sapele","Udu","Ughelli North","Ughelli South","Ukwuani","Uwheru","Warri North","Warri South","Warri South West"] },
  { code: "EB", name: "Ebonyi", is_fct: false, lgas: ["Abakaliki","Afikpo North","Afikpo South","Ebonyi","Ezza North","Ezza South","Ikwo","Ishielu","Ivo","Izzi","Ohaozara","Ohaukwu","Onicha"] },
  { code: "ED", name: "Edo", is_fct: false, lgas: ["Akoko-Edo","Egor","Esan Central","Esan North-East","Esan South-East","Esan West","Etsako Central","Etsako East","Etsako West","Igueben","Ikpoba Okha","Orhionmwon","Oredo","Ovia North-East","Ovia South-West","Owan East","Owan West","Uhunmwonde"] },
  { code: "EK", name: "Ekiti", is_fct: false, lgas: ["Ado Ekiti","Efon","Ekiti East","Ekiti South-West","Ekiti West","Emure","Gbonyin","Ido Osi","Ijero","Ikere","Ikole","Ilejemeje","Irepodun/Ifelodun","Ise/Orun","Moba","Oye"] },
  { code: "EN", name: "Enugu", is_fct: false, lgas: ["Aninri","Awgu","Enugu East","Enugu North","Enugu South","Ezeagu","Igbo Etiti","Igbo Eze North","Igbo Eze South","Isi Uzo","Nkanu East","Nkanu West","Nsukka","Oji River","Udenu","Udi","Uzo Uwani"] },
  { code: "GO", name: "Gombe", is_fct: false, lgas: ["Akko","Balanga","Billiri","Dukku","Funakaye","Gombe","Kaltungo","Kwami","Nafada","Shongom","Yamaltu/Deba"] },
  { code: "IM", name: "Imo", is_fct: false, lgas: ["Aboh Mbaise","Ahiazu Mbaise","Ehime Mbano","Ezinihitte","Ideato North","Ideato South","Ihitte/Uboma","Ikeduru","Isiala Mbano","Isu","Mbaitoli","Njaba","Nkwerre","Nwangele","Obowo","Oguta","Ohaji/Egbema","Okigwe","Orlu","Orsu","Oru East","Oru West","Owerri Municipal","Owerri North","Owerri West"] },
  { code: "JG", name: "Jigawa", is_fct: false, lgas: ["Auyo","Babura","Biriniwa","Birnin Kudu","Buji","Dutse","Gagarawa","Garki","Gumel","Guri","Gwaram","Gwiwa","Hadejia","Jahun","Kaugama","Kazaure","Kiri Kasamma","Maigatari","Malam Madori","Garka","Ringim","Roni","Sule Tankarkar","Taura","Yankwadi"] },
  { code: "KD", name: "Kaduna", is_fct: false, lgas: ["Chikun","Giwa","Igabi","Ikara","Jaba","Jema'a","Kachia","Kaduna North","Kaduna South","Kagarko","Kajuru","Kaura","Kauru","Kubau","Kudan","Lere","Makarfi","Sabon Gari","Sanga","Soba","Zangon Kataf","Zaria"] },
  { code: "KE", name: "Kano", is_fct: false, lgas: ["Ajingi","Albasu","Bagwai","Bebeji","Bichi","Bunkure","Dala","Dambatta","Dawakin Kudu","Dawakin Tofa","Doguwa","Fagge","Gabasawa","Garko","Garun Mallam","Gaya","Gezawa","Gwale","Gwarzo","Kabo","Kano Municipal","Karaye","Kibiya","Kiru","Kumbotso","Kunchi","Kura","Madobi","Makoda","Minjibir","Nasarawa","Rano","Rimin Gado","Rogo","Shanono","Sumaila","Takai","Tarauni","Tofa","Ungogo","Warawa","Yakawo","Yano","Zaria"] },
  { code: "KH", name: "Katsina", is_fct: false, lgas: ["Batsari","Dan Mira","Dandume","Danja","Daura","Dutsi","Dutsin Ma","Faskari","Funtua","Ingawa","Jibia","Kafur","Kaita","Katsina","Kurfa","Malusa","Mashi","Meta","Rimi","Sabuwa","Safana","Sandamu","Zango"] },
  { code: "KI", name: "Kebbi", is_fct: false, lgas: ["Aleme","Arewa","Argungu","Augie","Bagudo","Birnin Kebbi","Bunza","Dandi","Fakai","Gwandu","Jega","Kalgo","Koko/Besse","Maiyama","Ngaski","Sakaba","Shanga","Suru","Wasagu/Danko","Yauri","Zuru"] },
  { code: "KO", name: "Kogi", is_fct: false, lgas: ["Adavi","Ajaokuta","Ankpa","Bassa","Dekina","Ibaji","Idah","Igalamela Odolu","Ijumu","Kabba/Bunu","Kogi","Lokoja","Mopa","Ogi","Okenne","Okilany","Okene","Olamaboro","Omala","Yagba East","Yagba West"] },
  { code: "KW", name: "Kwara", is_fct: false, lgas: ["Asa","Baruten","Edu","Ekiti","Ifelodun","Ilorin East","Ilorin South","Ilorin West","Irepodun","Isin","Kaiama","Mangle","Marupa","Mokwa","Offa","Oke Ero","Oyun","Pategi"] },
  { code: "NA", name: "Nasarawa", is_fct: false, lgas: ["Akwanga","Awe","Doma","Karu","Keana","Keffi","Kokona","Lafia","Nasarawa","Nasarawa Egon","Obi","Toto","Wamba"] },
  { code: "NC", name: "Niger", is_fct: false, lgas: ["Agaie","Agwara","Bida","Borgu","Bosso","Chanchaga","Edati","Gbako","Gurara","Katcha","Kontagora","Lapai","Lavun","Magama","Mariga","Mashe","Mokwa","Muya","Paikoro","Rafi","Rijau","Shiroro","Suleja","Tafa","Wushishi"] },
  { code: "OG", name: "Ogun", is_fct: false, lgas: ["Abeokuta North","Abeokuta South","Ado-Odo/Ota","Egbado North","Egbado South","Ewekoro","Ifo","Ijebu East","Ijebu North","Ijebu North East","Ijebu Ode","Ikenne","Imeko Afon","Ipokia","Obafumi Orientale","Odeda","Odogbolu","Ogun Waterside","Remo North","Sagamu","Shaki"] },
  { code: "ON", name: "Ondo", is_fct: false, lgas: ["Akoko North-East","Akoko North-West","Akoko South-East","Akoko South-West","Akure North","Akure South","Ese Odo","Idanre","Ifedore","Ilaje","Ile Oluji/Okeigbo","Irele","Odigbo","Okitipupa","Ondo East","Ondo West","Ose","Owo"] },
  { code: "OS", name: "Osun", is_fct: false, lgas: ["Aiyedade","Aiyegunle","Atakunmosa East","Atakunmosa West","Boluwaduro","Boripe","Ede North","Ede South","Egbedore","Ejigbo","Ife Central","Ife East","Ife North","Ife South","Ifedayo","Ifelodun","Ila","Ilesa East","Ilesa West","Irepodun","Irewole","Isokan","Iwo","Obokun","Odo Otin","Ola Oluwa","Olorunda","Oriade","Orolu","Osogbo"] },
  { code: "OY", name: "Oyo", is_fct: false, lgas: ["Afijio","Akinyele","Atiba","Atisbo","Egbeda","Ibadan North","Ibadan North-East","Ibadan North-West","Ibadan South-East","Ibadan South-West","Ibarapa Central","Ibarapa East","Ibarapa North","Ido","Irepo","Iseyin","Itesiwaju","Iwajin","Iwo","Kajola","Ogbomosho North","Ogbomosho South","Ogo Oluwa","Olorunsogo","Oluyole","Ona Ara","Orelope","Ori Ire","Oyo East","Oyo West","Saki East","Saki West","Surulere"] },
  { code: "PL", name: "Plateau", is_fct: false, lgas: ["Barkin Ladi","Bassa","Bokkos","Jos East","Jos North","Jos South","Kanam","Kanke","Langtang North","Langtang South","Mangu","Miango","Mpoma","Pankshin","Qua Pan","Rukubi","Shendam","Wase"] },
  { code: "RN", name: "Rivers", is_fct: false, lgas: ["Abua/Odual","Ahoada East","Ahoada West","Akuku-Toru","Andoni","Asari-Toru","Bonny","Degema","Eleme","Emuoha","Etche","Gokana","Ikwerre","Khana","Obio/Akpor","Ogba-Egbema-Ndoni","Ogu/Ben","Okrika","Omuma","Opobo/Nkoro","Oyigbo","Port Harcourt","Tai"] },
  { code: "SO", name: "Sokoto", is_fct: false, lgas: ["Bin Kalifa","Bodinga","Dange Shuni","Gada","Goronyo","Gudu","Gwadabawa","Illela","Isa","Kebbe","Kware","Rabah","Sabon Birni","Shagari","Silame","Sokoto North","Sokoto South","Tambuwal","Tangaza","Tureta","Wamako","Wurno","Yabo"] },
  { code: "TA", name: "Taraba", is_fct: false, lgas: ["Ardo Kola","Bali","Donga","Gashaka","Gassol","Ibi","Jalingo","Karim Lamido","Kumi","Lau","Sardauna","Takum","Ussa","Wukari","Yorro","Zing"] },
  { code: "YO", name: "Yobe", is_fct: false, lgas: ["Bade","Bursari","Damaturu","Fika","Fune","Geidam","Gujba","Gulma","Jakusko","Karasuwa","Machina","Nangere","Nguru","Potiskum","Tarmuwa","Yunusari","Yusufari"] },
  { code: "ZA", name: "Zamfara", is_fct: false, lgas: ["Anka","Bakura","Birnin Magaji/Kiyaw","Bukkuyum","Bungudu","Gummi","Gusau","Kaura Namoda","Maradun","Maru","Shinkafi","Talata Mafara","Chafe","Zurmi"] },
  { code: "FC", name: "Federal Capital Territory", is_fct: true, lgas: ["Abaji","Bwari","Gwagwalada","Kuje","Kwali","Municipal Area Council"] },
];

const CLEAN_STATES = STATES;

export function matchAdjacencyRows(): { sector_a: string; sector_b: string }[] {
  const rows: { sector_a: string; sector_b: string }[] = [];
  for (const [a, b] of ADJACENCY_PAIRS) {
    rows.push({ sector_a: a, sector_b: b });
    rows.push({ sector_a: b, sector_b: a });
  }
  return rows;
}

export const ORGS_SEED = {
  ngos: [
    { legal_name: "Bright Futures Education Trust", display_name: "Bright Futures", cac_number: "RC-1284503", sectors: ["Education", "Youth Empowerment & Skills"], hq_state: "LA" },
    { legal_name: "Clean Water Initiative Nigeria", display_name: "CleanWater NG", cac_number: "RC-9872110", sectors: ["Water & Sanitation", "Health"], hq_state: "AB" },
    { legal_name: "Green Sahel Farmers Collective", display_name: "Green Sahel", cac_number: "RC-5512098", sectors: ["Food Security & Agriculture", "Environment & Climate"], hq_state: "KD" },
  ],
  companies: [
    { legal_name: "Meridian Bank Plc", display_name: "Meridian Bank", sectors: ["Education", "Health"], hq_state: "LA" },
    { legal_name: "Delta Energy Holdings Ltd", display_name: "Delta Energy", sectors: ["Environment & Climate", "Youth Empowerment & Skills"], hq_state: "DE" },
  ],
  admins: [{ email: "ops@jikota.ng", role: "admin" }],
};

export function buildManifest() {
  return {
    states: CLEAN_STATES.map(({ code, name, is_fct }) => ({ code, name, is_fct })),
    lgas: CLEAN_STATES.flatMap((s) => s.lgas.map((name) => ({ state_code: s.code, name }))),
    match_adjacency: matchAdjacencyRows(),
    organizations: [
      ...ORGS_SEED.ngos.map((o) => ({ ...o, type: "ngo" as const })),
      ...ORGS_SEED.companies.map((o) => ({ ...o, type: "company" as const })),
    ],
    admin: ORGS_SEED.admins[0],
  };
}

if (process.argv[1] && process.argv[1].endsWith("gen-seed.ts")) {
  const m = buildManifest();
  writeFileSync(fileURLToPath(new URL("../supabase/seed-manifest.json", import.meta.url)), JSON.stringify(m, null, 2));
  const esc = (x: string) => x.replace(/'/g, "''");
  const rows = m.lgas.map((l) => `('${l.state_code}','${esc(l.name)}')`).join(",\n  ");
  writeFileSync(
    fileURLToPath(new URL("../supabase/lga_seed.sql", import.meta.url)),
    "-- Generated by scripts/gen-seed.ts — do not edit by hand.\ninsert into lgas (state_code, name) values\n  " + rows + ";\n",
  );
  console.log("Wrote supabase/seed-manifest.json and supabase/lga_seed.sql");
}
