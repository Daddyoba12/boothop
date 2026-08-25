/**
 * Seeds compliance_rules directly from static data — no Claude API needed.
 * Run: npx tsx scripts/seed-compliance-rules-static.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface Rule {
  from_region: string;
  to_region: string;
  item_keyword: string;
  category: string;
  verdict: 'PERMITTED' | 'RESTRICTED' | 'PROHIBITED' | 'REVIEW_REQUIRED';
  explanation: string;
  legal_ref: string;
  confidence: number;
}

const RULES: Rule[] = [
  // ─── Nigeria → UK ──────────────────────────────────────────────────────────
  { from_region:'NG', to_region:'GB', item_keyword:'khat', category:'drugs', verdict:'PROHIBITED',
    explanation:'Khat (Catha edulis) is a Class C controlled substance in the UK and is completely banned. Carrying khat from Nigeria can result in arrest and prosecution.',
    legal_ref:'Misuse of Drugs Act 1971 (amended 2014)', confidence:99 },
  { from_region:'NG', to_region:'GB', item_keyword:'bush meat', category:'food', verdict:'PROHIBITED',
    explanation:'Bush meat (wild animal meat including monkey, pangolin, rodents) is prohibited from entering the UK under animal health regulations. Any form — fresh, dried, smoked or frozen — is banned.',
    legal_ref:'UK Animal Health Act 1981; CITES Appendix I/II', confidence:99 },
  { from_region:'NG', to_region:'GB', item_keyword:'bushmeat', category:'food', verdict:'PROHIBITED',
    explanation:'Bushmeat from Nigeria is completely prohibited at the UK border due to animal disease risk and CITES protections. Seizure and destruction are automatic.',
    legal_ref:'UK Animal Health Act 1981; CITES', confidence:99 },
  { from_region:'NG', to_region:'GB', item_keyword:'ivory', category:'wildlife', verdict:'PROHIBITED',
    explanation:'Ivory and elephant products are banned under the UK Ivory Act 2018 and CITES Appendix I. Trading or importing ivory is a criminal offence with up to 5 years imprisonment.',
    legal_ref:'UK Ivory Act 2018; CITES Appendix I', confidence:99 },
  { from_region:'NG', to_region:'GB', item_keyword:'fresh meat', category:'food', verdict:'PROHIBITED',
    explanation:'Fresh, chilled, or frozen meat from Nigeria is prohibited under UK animal health rules to prevent spread of animal diseases like foot-and-mouth.',
    legal_ref:'Retained EU Reg 2002/99/EC; UK Animal Health Act 1981', confidence:98 },
  { from_region:'NG', to_region:'GB', item_keyword:'ponmo', category:'food', verdict:'PROHIBITED',
    explanation:'Ponmo (cow skin/hide) is classified as an animal product and is prohibited from entering the UK from Nigeria without a health certificate, which is not issued for personal imports.',
    legal_ref:'UK Animal Health Act 1981; APHA import rules', confidence:92 },
  { from_region:'NG', to_region:'GB', item_keyword:'suya', category:'food', verdict:'PROHIBITED',
    explanation:'Suya (spiced grilled meat) is a meat product and is prohibited from Nigeria to the UK. All meat-based products from Nigeria are banned regardless of processing method.',
    legal_ref:'UK Animal Health Act 1981', confidence:95 },
  { from_region:'NG', to_region:'GB', item_keyword:'stockfish', category:'food', verdict:'RESTRICTED',
    explanation:'Stockfish (dried/salted cod) is generally permitted if commercially produced and properly packaged. It must be declared and may be inspected. Personal quantities only.',
    legal_ref:'HMRC Notice 1; UK food import rules', confidence:82 },
  { from_region:'NG', to_region:'GB', item_keyword:'egusi', category:'food', verdict:'PERMITTED',
    explanation:'Egusi (dried melon seeds) is a plant-based food product and is generally permitted into the UK. Commercial packaging is recommended.',
    legal_ref:'HMRC plant health rules', confidence:85 },
  { from_region:'NG', to_region:'GB', item_keyword:'palm oil', category:'food', verdict:'PERMITTED',
    explanation:'Palm oil in sealed commercial containers is permitted. Homemade or unlabelled palm oil may be inspected.',
    legal_ref:'HMRC food import rules', confidence:83 },
  { from_region:'NG', to_region:'GB', item_keyword:'medication', category:'medication', verdict:'RESTRICTED',
    explanation:'Prescription medications must be carried with a valid prescription in original packaging. Controlled drugs require a Home Office personal licence for quantities exceeding 3 months supply.',
    legal_ref:'Misuse of Drugs Regulations 2001; MHRA guidelines', confidence:95 },
  { from_region:'NG', to_region:'GB', item_keyword:'cash', category:'cash', verdict:'RESTRICTED',
    explanation:'Cash (or equivalent monetary instruments) of GBP 10,000 or more must be declared to UK Border Force on arrival. Failure to declare can result in seizure.',
    legal_ref:'Proceeds of Crime Act 2002; UK Customs cash declaration rules', confidence:99 },
  { from_region:'NG', to_region:'GB', item_keyword:'herbal medicine', category:'medication', verdict:'REVIEW_REQUIRED',
    explanation:'Traditional Nigerian herbal medicines may contain regulated substances or undeclared ingredients. Products making medicinal claims without UK MHRA approval may be seized.',
    legal_ref:'MHRA Enforcement; Human Medicines Regulations 2012', confidence:88 },
  { from_region:'NG', to_region:'GB', item_keyword:'cannabis', category:'drugs', verdict:'PROHIBITED',
    explanation:'Cannabis and cannabis products are Class B controlled substances in the UK. Import from Nigeria is a criminal offence.',
    legal_ref:'Misuse of Drugs Act 1971 (Class B)', confidence:99 },
  { from_region:'NG', to_region:'GB', item_keyword:'plants', category:'plants', verdict:'RESTRICTED',
    explanation:'Most plants and plant material from Nigeria require a phytosanitary certificate issued by Nigerian authorities (NAQS). Without it, plants will be seized at the UK border.',
    legal_ref:'UK Plant Health (England) Order 2015; retained EU phytosanitary rules', confidence:95 },
  { from_region:'NG', to_region:'GB', item_keyword:'seeds', category:'plants', verdict:'RESTRICTED',
    explanation:'Seeds from Nigeria require a phytosanitary certificate from NAQS (Nigeria Agricultural Quarantine Service). Uncertified seeds will be confiscated.',
    legal_ref:'UK Plant Health Order 2015', confidence:93 },
  { from_region:'NG', to_region:'GB', item_keyword:'tobacco', category:'other', verdict:'RESTRICTED',
    explanation:'200 cigarettes or 50 cigars or 250g loose tobacco may be brought duty-free. Exceeding this requires customs duty payment. Quantities exceeding 3200 cigarettes are treated as commercial and may be seized.',
    legal_ref:'HMRC Notice 1; Tobacco Products Duty Act 1979', confidence:97 },
  { from_region:'NG', to_region:'GB', item_keyword:'alcohol', category:'other', verdict:'RESTRICTED',
    explanation:'Duty-free allowance: 1 litre of spirits over 22% ABV or 2 litres of wine/sparkling wine. Larger quantities attract UK customs duty.',
    legal_ref:'HMRC Notice 1; Customs Excise Management Act 1979', confidence:97 },
  { from_region:'NG', to_region:'GB', item_keyword:'firearms', category:'weapons', verdict:'PROHIBITED',
    explanation:'Firearms and ammunition cannot be brought into the UK without prior written authority from the Home Office. Unauthorised import is a serious criminal offence.',
    legal_ref:'Firearms Act 1968; Customs and Excise Management Act 1979', confidence:99 },
  { from_region:'NG', to_region:'GB', item_keyword:'pangolin', category:'wildlife', verdict:'PROHIBITED',
    explanation:'Pangolins and all pangolin products (scales, skin, meat) are listed under CITES Appendix I and are absolutely prohibited from import into the UK.',
    legal_ref:'CITES Appendix I; Control of Trade in Endangered Species Regs 2018', confidence:99 },

  // ─── UK → Nigeria ──────────────────────────────────────────────────────────
  { from_region:'GB', to_region:'NG', item_keyword:'medication', category:'medication', verdict:'RESTRICTED',
    explanation:'Prescription medications must comply with NAFDAC regulations. Personal use quantities (up to 3 months supply) with a valid prescription are generally permitted. Controlled substances may require NDLEA permit.',
    legal_ref:'NAFDAC Act Cap N1 LFN 2004; NDLEA Act Cap N30', confidence:92 },
  { from_region:'GB', to_region:'NG', item_keyword:'food supplements', category:'medication', verdict:'RESTRICTED',
    explanation:'Nutritional and dietary supplements require NAFDAC registration to be legally imported into Nigeria. Unregistered supplements may be confiscated at the airport.',
    legal_ref:'NAFDAC Decree No. 19 of 1993', confidence:90 },
  { from_region:'GB', to_region:'NG', item_keyword:'cosmetics', category:'cosmetics', verdict:'RESTRICTED',
    explanation:'Cosmetics must be NAFDAC-registered to be legally sold or imported commercially. Personal-use quantities are generally allowed but may be queried.',
    legal_ref:'NAFDAC Act; NAFDAC Cosmetics Regulations', confidence:88 },
  { from_region:'GB', to_region:'NG', item_keyword:'used clothing', category:'other', verdict:'RESTRICTED',
    explanation:'Used clothing (okirika/bend-down select) faces import restrictions in Nigeria. Commercial imports are controlled; personal quantities are generally allowed.',
    legal_ref:'Nigerian Customs Service regulations; SON import rules', confidence:82 },
  { from_region:'GB', to_region:'NG', item_keyword:'electronics', category:'electronics', verdict:'RESTRICTED',
    explanation:'Electronics must meet SON (Standards Organisation of Nigeria) standards. Commercial quantities require SON certification. Personal devices are permitted but commercial imports may be held for inspection.',
    legal_ref:'SON Act Cap S9 LFN 2004', confidence:85 },
  { from_region:'GB', to_region:'NG', item_keyword:'cash', category:'cash', verdict:'RESTRICTED',
    explanation:'Cash or monetary instruments of USD 10,000 equivalent or more must be declared to Nigerian Customs on arrival. Undeclared cash may be seized.',
    legal_ref:'Nigerian Customs Service Act; Money Laundering (Prohibition) Act 2011', confidence:95 },
  { from_region:'GB', to_region:'NG', item_keyword:'cannabis', category:'drugs', verdict:'PROHIBITED',
    explanation:'Cannabis is absolutely prohibited in Nigeria. Import, possession or trafficking carries severe penalties including imprisonment under NDLEA regulations.',
    legal_ref:'NDLEA Act Cap N30 LFN 2004; Trafficking in Persons Act', confidence:99 },
  { from_region:'GB', to_region:'NG', item_keyword:'firearms', category:'weapons', verdict:'PROHIBITED',
    explanation:'Firearms and ammunition require prior government authorisation to import into Nigeria. Unauthorised import is a criminal offence punishable by imprisonment.',
    legal_ref:'Firearms Act Cap F28 LFN 2004', confidence:99 },
  { from_region:'GB', to_region:'NG', item_keyword:'alcohol', category:'other', verdict:'RESTRICTED',
    explanation:'Alcohol is permitted in Nigeria but subject to customs duty above duty-free limits. Commercial quantities require import licence. Note: alcohol is prohibited in some northern states under Sharia law.',
    legal_ref:'Nigerian Customs Service; Customs Excise Tariff Act', confidence:90 },
  { from_region:'GB', to_region:'NG', item_keyword:'second hand phones', category:'electronics', verdict:'RESTRICTED',
    explanation:'Used mobile phones require NCC (Nigerian Communications Commission) type approval. Commercial imports of used phones face stricter scrutiny.',
    legal_ref:'NCC Act 2003; SON regulations', confidence:80 },
  { from_region:'GB', to_region:'NG', item_keyword:'plants', category:'plants', verdict:'RESTRICTED',
    explanation:'Plants and plant material entering Nigeria require a phytosanitary certificate from UK APHA. NAQS (Nigeria Agricultural Quarantine Service) inspects all plant imports.',
    legal_ref:'Plant Disease (Emergency Provisions) Act Cap P19; NAQS Act', confidence:88 },

  // ─── Nigeria → USA ─────────────────────────────────────────────────────────
  { from_region:'NG', to_region:'US', item_keyword:'bush meat', category:'food', verdict:'PROHIBITED',
    explanation:'All bush meat from Nigeria is prohibited from entering the USA. USDA APHIS and CBP strictly enforce the ban due to risk of exotic animal diseases including foot-and-mouth.',
    legal_ref:'7 USC 8301 (Animal Health Protection Act); 9 CFR Part 94', confidence:99 },
  { from_region:'NG', to_region:'US', item_keyword:'fresh fruit', category:'food', verdict:'RESTRICTED',
    explanation:'Most fresh fruits from Nigeria require USDA APHIS phytosanitary inspection and may be prohibited or restricted depending on species and pest risk. Declare all fruit at customs.',
    legal_ref:'7 USC 7701 (Plant Protection Act); USDA APHIS PPQ', confidence:92 },
  { from_region:'NG', to_region:'US', item_keyword:'medication', category:'medication', verdict:'RESTRICTED',
    explanation:'Personal medications should be in original prescription packaging. Controlled substances (DEA Schedule I-V) require DEA import permit even for personal use beyond 50 dosage units.',
    legal_ref:'21 USC 812 (Controlled Substances Act); DEA 21 CFR 1312', confidence:95 },
  { from_region:'NG', to_region:'US', item_keyword:'cash', category:'cash', verdict:'RESTRICTED',
    explanation:'Cash or monetary instruments of USD 10,000 or more must be declared to US Customs on FinCEN Form 105. Failure to declare is a federal crime.',
    legal_ref:'31 USC 5316; FinCEN Form 105; 31 CFR 1010.340', confidence:99 },
  { from_region:'NG', to_region:'US', item_keyword:'ivory', category:'wildlife', verdict:'PROHIBITED',
    explanation:'Elephant ivory import is banned under the US Endangered Species Act and CITES. The US Fish and Wildlife Service enforces this with criminal penalties.',
    legal_ref:'16 USC 1538 (Endangered Species Act); CITES Appendix I', confidence:99 },
  { from_region:'NG', to_region:'US', item_keyword:'khat', category:'drugs', verdict:'PROHIBITED',
    explanation:'Khat is a Schedule I controlled substance in the USA. Import from Nigeria is a federal criminal offence regardless of quantity.',
    legal_ref:'21 USC 812 Schedule I(c)(14)', confidence:99 },
  { from_region:'NG', to_region:'US', item_keyword:'cannabis', category:'drugs', verdict:'PROHIBITED',
    explanation:'Cannabis remains a Schedule I controlled substance under federal US law. Import from Nigeria is a federal crime regardless of any state-level legalisation.',
    legal_ref:'21 USC 812 Schedule I(c)(10)', confidence:99 },
  { from_region:'NG', to_region:'US', item_keyword:'food products', category:'food', verdict:'RESTRICTED',
    explanation:'Commercial food imports from Nigeria require FDA prior notice and may require FDA facility registration. Personal-use food quantities are generally permitted but must be declared.',
    legal_ref:'21 USC 384d (FDA prior notice); 21 CFR Part 1', confidence:88 },

  // ─── USA → Nigeria ─────────────────────────────────────────────────────────
  { from_region:'US', to_region:'NG', item_keyword:'medication', category:'medication', verdict:'RESTRICTED',
    explanation:'Medications entering Nigeria must comply with NAFDAC regulations. Personal quantities (3 months supply) with prescription are generally accepted. NAFDAC may inspect or query unregistered brands.',
    legal_ref:'NAFDAC Act Cap N1 LFN 2004', confidence:90 },
  { from_region:'US', to_region:'NG', item_keyword:'cash', category:'cash', verdict:'RESTRICTED',
    explanation:'Cash exceeding USD 10,000 equivalent must be declared to Nigerian Customs on arrival. The foreign currency must also be declared to the Central Bank of Nigeria if being moved commercially.',
    legal_ref:'Nigerian Customs Service Act; CBN Foreign Exchange Manual', confidence:95 },
  { from_region:'US', to_region:'NG', item_keyword:'cannabis', category:'drugs', verdict:'PROHIBITED',
    explanation:'Cannabis is absolutely prohibited in Nigeria regardless of source. NDLEA imposes severe penalties including long prison terms.',
    legal_ref:'NDLEA Act Cap N30 LFN 2004', confidence:99 },
  { from_region:'US', to_region:'NG', item_keyword:'firearms', category:'weapons', verdict:'PROHIBITED',
    explanation:'Firearms cannot be imported into Nigeria without prior written government authorisation. This is enforced extremely strictly; violation results in criminal prosecution.',
    legal_ref:'Firearms Act Cap F28 LFN 2004', confidence:99 },
  { from_region:'US', to_region:'NG', item_keyword:'food supplements', category:'medication', verdict:'RESTRICTED',
    explanation:'Food supplements and vitamins entering Nigeria must be NAFDAC-registered for commercial sale. Personal-use quantities are tolerated but may be queried.',
    legal_ref:'NAFDAC Act Cap N1 LFN 2004', confidence:88 },

  // ─── Africa → UK (broad) ───────────────────────────────────────────────────
  { from_region:'AFRICA', to_region:'GB', item_keyword:'bush meat', category:'food', verdict:'PROHIBITED',
    explanation:'Bush meat from any African country is prohibited from entering the UK. UK Border Force and APHA routinely seize African bush meat at ports of entry.',
    legal_ref:'UK Animal Health Act 1981; CITES', confidence:99 },
  { from_region:'AFRICA', to_region:'GB', item_keyword:'ivory', category:'wildlife', verdict:'PROHIBITED',
    explanation:'Ivory and ivory products from any African country are prohibited under the UK Ivory Act 2018 and CITES Appendix I. Very limited antique exemptions apply.',
    legal_ref:'UK Ivory Act 2018; CITES Appendix I', confidence:99 },
  { from_region:'AFRICA', to_region:'GB', item_keyword:'fresh meat', category:'food', verdict:'PROHIBITED',
    explanation:'Fresh, chilled, or frozen meat products from African countries are prohibited from entering the UK without prior authorisation (which is not granted for personal imports).',
    legal_ref:'UK Animal Health Act 1981; retained EU Reg 2002/99/EC', confidence:98 },
  { from_region:'AFRICA', to_region:'GB', item_keyword:'wildlife products', category:'wildlife', verdict:'PROHIBITED',
    explanation:'Products made from CITES-listed African wildlife (skins, horns, feathers, teeth, shells) are prohibited or require CITES permits. This includes rhino horn, elephant products, big cat skins.',
    legal_ref:'CITES; Control of Trade in Endangered Species Regs 2018 (COTES)', confidence:99 },
  { from_region:'AFRICA', to_region:'GB', item_keyword:'cash', category:'cash', verdict:'RESTRICTED',
    explanation:'GBP 10,000 or more (or equivalent in any currency) must be declared to UK Border Force. Undeclared cash is subject to seizure.',
    legal_ref:'Proceeds of Crime Act 2002; Customs cash declaration rules', confidence:99 },
  { from_region:'AFRICA', to_region:'GB', item_keyword:'plants', category:'plants', verdict:'RESTRICTED',
    explanation:'Plants and plant material from African countries require a phytosanitary certificate from the country of origin. Without it, plants will be confiscated.',
    legal_ref:'UK Plant Health (England) Order 2015', confidence:94 },
  { from_region:'AFRICA', to_region:'GB', item_keyword:'rhino horn', category:'wildlife', verdict:'PROHIBITED',
    explanation:'Rhino horn is listed under CITES Appendix I and is absolutely prohibited. Carrying rhino horn is a serious criminal offence in the UK.',
    legal_ref:'CITES Appendix I; COTES 2018', confidence:99 },

  // ─── Africa → EU (broad) ───────────────────────────────────────────────────
  { from_region:'AFRICA', to_region:'EU', item_keyword:'bush meat', category:'food', verdict:'PROHIBITED',
    explanation:'Bush meat from Africa is prohibited from entering the EU under animal by-product regulations (Reg 1069/2009). EU Border Force routinely seizes African bush meat.',
    legal_ref:'EU Reg 1069/2009 (animal by-products); EU Reg 206/2010', confidence:98 },
  { from_region:'AFRICA', to_region:'EU', item_keyword:'ivory', category:'wildlife', verdict:'PROHIBITED',
    explanation:'Ivory import into the EU is prohibited under EU Wildlife Trade Regulations implementing CITES Appendix I. Only pre-Convention antiques with documentation may qualify for exemption.',
    legal_ref:'EU Reg 338/97 (Wildlife Trade); CITES Appendix I', confidence:99 },
  { from_region:'AFRICA', to_region:'EU', item_keyword:'cash', category:'cash', verdict:'RESTRICTED',
    explanation:'Cash of EUR 10,000 or more (or equivalent) must be declared in writing to EU customs on entry. Failure to declare results in seizure.',
    legal_ref:'EU Reg 1889/2005 (cash controls)', confidence:99 },
  { from_region:'AFRICA', to_region:'EU', item_keyword:'fresh meat', category:'food', verdict:'PROHIBITED',
    explanation:'Fresh meat from African countries is prohibited from entering the EU. Only meat from approved third countries with veterinary health certificates may enter.',
    legal_ref:'EU Reg 2002/99/EC; EU Reg 206/2010', confidence:98 },
  { from_region:'AFRICA', to_region:'EU', item_keyword:'wildlife products', category:'wildlife', verdict:'PROHIBITED',
    explanation:'Wildlife products from CITES-listed African species require CITES permits to enter the EU. Many are absolutely prohibited (Appendix I species).',
    legal_ref:'EU Reg 338/97; CITES', confidence:99 },
  { from_region:'AFRICA', to_region:'EU', item_keyword:'medication', category:'medication', verdict:'RESTRICTED',
    explanation:'Personal medications should be in original packaging with prescription. Controlled substances may require import authorisation from the EU member state health authority.',
    legal_ref:'EU Directive 2001/83/EC; individual member state regulations', confidence:88 },

  // ─── Africa → USA (broad) ──────────────────────────────────────────────────
  { from_region:'AFRICA', to_region:'US', item_keyword:'bush meat', category:'food', verdict:'PROHIBITED',
    explanation:'Bush meat from any African country is prohibited by USDA APHIS and CBP. It poses significant risk of introducing exotic animal diseases.',
    legal_ref:'7 USC 8301 (Animal Health Protection Act); 9 CFR Part 94', confidence:99 },
  { from_region:'AFRICA', to_region:'US', item_keyword:'ivory', category:'wildlife', verdict:'PROHIBITED',
    explanation:'African elephant ivory is prohibited from import into the USA under ESA and CITES. US Fish and Wildlife Service actively enforces this with criminal penalties.',
    legal_ref:'16 USC 1538 (ESA); CITES Appendix I; 50 CFR Part 17', confidence:99 },
  { from_region:'AFRICA', to_region:'US', item_keyword:'cash', category:'cash', verdict:'RESTRICTED',
    explanation:'USD 10,000 or more in cash or monetary instruments must be declared to US Customs on FinCEN Form 105. Failure to declare is a federal crime.',
    legal_ref:'31 USC 5316; FinCEN 105', confidence:99 },
  { from_region:'AFRICA', to_region:'US', item_keyword:'wildlife products', category:'wildlife', verdict:'PROHIBITED',
    explanation:'Wildlife products from CITES Appendix I African species (elephant, rhino, lion, leopard, cheetah, gorilla) are prohibited. Other species require CITES permits.',
    legal_ref:'CITES; 16 USC 1538 (ESA); 50 CFR Part 23', confidence:99 },

  // ─── USA → Africa (broad) ──────────────────────────────────────────────────
  { from_region:'US', to_region:'AFRICA', item_keyword:'medication', category:'medication', verdict:'RESTRICTED',
    explanation:'US prescription medications taken to African countries should be in original packaging with prescriptions. Controlled substances may require import permits from destination country health authorities.',
    legal_ref:'Destination country health ministry regulations; DEA export rules', confidence:85 },
  { from_region:'US', to_region:'AFRICA', item_keyword:'firearms', category:'weapons', verdict:'PROHIBITED',
    explanation:'Firearms and ammunition to African countries generally require State Dept export licence (ITAR/EAR) and destination country import permit. Personal travel with firearms is heavily restricted.',
    legal_ref:'22 USC 2778 (ITAR); 15 CFR 730-774 (EAR)', confidence:92 },
  { from_region:'US', to_region:'AFRICA', item_keyword:'cash', category:'cash', verdict:'RESTRICTED',
    explanation:'USD 10,000 or more must be declared when leaving the USA (FinCEN 105). Most African countries also require declaration on arrival above local thresholds.',
    legal_ref:'31 USC 5316; FinCEN 105', confidence:95 },
  { from_region:'US', to_region:'AFRICA', item_keyword:'electronics', category:'electronics', verdict:'RESTRICTED',
    explanation:'Personal electronics are generally permitted but commercial quantities may require destination country customs duties and standard-body approvals (e.g. SON in Nigeria, KEBS in Kenya).',
    legal_ref:'Destination country customs regulations', confidence:80 },

  // ─── Ghana → UK ────────────────────────────────────────────────────────────
  { from_region:'GH', to_region:'GB', item_keyword:'fresh fish', category:'food', verdict:'RESTRICTED',
    explanation:'Dried or smoked fish from Ghana is generally permitted if commercially packaged and labelled. Fresh fish requires UK CITES/health certification for certain species.',
    legal_ref:'HMRC food import rules; UK Fish Health Regs', confidence:80 },
  { from_region:'GH', to_region:'GB', item_keyword:'kente cloth', category:'other', verdict:'PERMITTED',
    explanation:'Kente and other Ghanaian textiles are permitted to bring into the UK. No restrictions apply to cultural textiles.',
    legal_ref:'HMRC general goods rules', confidence:95 },
  { from_region:'GH', to_region:'GB', item_keyword:'shea butter', category:'cosmetics', verdict:'PERMITTED',
    explanation:'Shea butter for personal use is generally permitted. Commercial quantities may require HMRC import duty payment.',
    legal_ref:'HMRC commodity code 1515 90; UK Global Tariff', confidence:85 },
  { from_region:'GH', to_region:'GB', item_keyword:'bush meat', category:'food', verdict:'PROHIBITED',
    explanation:'Bush meat from Ghana, including smoked or dried wild game, is prohibited from entering the UK under animal health and CITES rules.',
    legal_ref:'UK Animal Health Act 1981; CITES', confidence:98 },
  { from_region:'GH', to_region:'GB', item_keyword:'cash', category:'cash', verdict:'RESTRICTED',
    explanation:'GBP 10,000 or more (or equivalent) must be declared to UK Border Force. This applies to all travellers including from Ghana.',
    legal_ref:'Proceeds of Crime Act 2002', confidence:99 },

  // ─── Kenya → UK ────────────────────────────────────────────────────────────
  { from_region:'KE', to_region:'GB', item_keyword:'fresh flowers', category:'plants', verdict:'RESTRICTED',
    explanation:'Fresh cut flowers from Kenya (a major export) require a phytosanitary certificate from KEPHIS (Kenya Plant Health Inspectorate Service) for UK import.',
    legal_ref:'UK Plant Health Order 2015; KEPHIS export certification', confidence:90 },
  { from_region:'KE', to_region:'GB', item_keyword:'coffee', category:'food', verdict:'PERMITTED',
    explanation:'Roasted coffee beans and packaged ground coffee from Kenya are permitted. Green (unroasted) coffee beans may require phytosanitary documentation.',
    legal_ref:'HMRC commodity tariff; UK plant health rules', confidence:88 },
  { from_region:'KE', to_region:'GB', item_keyword:'tea', category:'food', verdict:'PERMITTED',
    explanation:'Packaged Kenyan tea is permitted into the UK. Standard UK food import rules apply — commercial imports require customs duties above duty-free limits.',
    legal_ref:'HMRC Notice 1; UK food import rules', confidence:92 },
  { from_region:'KE', to_region:'GB', item_keyword:'wildlife products', category:'wildlife', verdict:'PROHIBITED',
    explanation:'Wildlife products from Kenya including Maasai beadwork made from CITES species, ivory, or big cat products are prohibited without valid CITES permits.',
    legal_ref:'CITES; Control of Trade in Endangered Species Regs 2018', confidence:95 },
  { from_region:'KE', to_region:'GB', item_keyword:'cash', category:'cash', verdict:'RESTRICTED',
    explanation:'GBP 10,000 or more in cash must be declared to UK Border Force on arrival.',
    legal_ref:'Proceeds of Crime Act 2002', confidence:99 },

  // ─── Universal prohibitions (ANY → ANY) ────────────────────────────────────
  { from_region:'ANY', to_region:'ANY', item_keyword:'explosives', category:'weapons', verdict:'PROHIBITED',
    explanation:'Explosives, detonators, and explosive materials are absolutely prohibited on passenger aircraft worldwide under IATA DGR and ICAO Annex 17. Criminal penalties apply universally.',
    legal_ref:'IATA DGR; ICAO Annex 17; national aviation security acts', confidence:99 },
  { from_region:'ANY', to_region:'ANY', item_keyword:'counterfeit goods', category:'other', verdict:'PROHIBITED',
    explanation:'Counterfeit goods (fake branded items) are prohibited from import in virtually all countries under IP and customs law. They will be seized and destroyed at the border.',
    legal_ref:'TRIPS Agreement; destination country customs and IP law', confidence:99 },
  { from_region:'ANY', to_region:'ANY', item_keyword:'lithium batteries', category:'electronics', verdict:'RESTRICTED',
    explanation:'Loose lithium batteries must travel in carry-on baggage only (not checked). Spare batteries over 100Wh require airline approval. Batteries over 160Wh are prohibited on passenger aircraft.',
    legal_ref:'IATA DGR Section 2; ICAO Technical Instructions', confidence:96 },
  { from_region:'ANY', to_region:'ANY', item_keyword:'human remains', category:'other', verdict:'REVIEW_REQUIRED',
    explanation:'Human remains (including ashes/cremated remains) require significant documentation including death certificates, embalming certificates, and consular approval. Always arrange through a funeral director.',
    legal_ref:'Destination country health and customs regulations; IATA funeral rules', confidence:95 },
  { from_region:'ANY', to_region:'ANY', item_keyword:'cannabis', category:'drugs', verdict:'PROHIBITED',
    explanation:'Cannabis remains prohibited for international transport in virtually all countries regardless of local legalisation. Do not carry cannabis across any international border.',
    legal_ref:'UN Single Convention on Narcotic Drugs 1961; national laws', confidence:99 },
  { from_region:'ANY', to_region:'ANY', item_keyword:'heroin', category:'drugs', verdict:'PROHIBITED',
    explanation:'Heroin (diacetylmorphine) is a Class A controlled substance and internationally prohibited narcotic. International trafficking carries extreme criminal penalties worldwide.',
    legal_ref:'UN Single Convention on Narcotic Drugs 1961 (Schedule I)', confidence:99 },
  { from_region:'ANY', to_region:'ANY', item_keyword:'cocaine', category:'drugs', verdict:'PROHIBITED',
    explanation:'Cocaine is an internationally prohibited narcotic. International trafficking is a serious criminal offence in all countries carrying long prison sentences.',
    legal_ref:'UN Single Convention on Narcotic Drugs 1961 (Schedule I)', confidence:99 },
];

async function main() {
  console.log(`Seeding ${RULES.length} static compliance rules...`);

  // De-duplicate by (from, to, keyword)
  const deduped = new Map<string, Rule>();
  for (const rule of RULES) {
    const key = `${rule.from_region}|${rule.to_region}|${rule.item_keyword}`;
    if (!deduped.has(key)) deduped.set(key, rule);
  }
  const toInsert = Array.from(deduped.values());
  console.log(`After dedup: ${toInsert.length} rules`);

  // Insert in batches of 50
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 50) {
    const batch = toInsert.slice(i, i + 50);
    const { error } = await supabase
      .from('compliance_rules')
      .upsert(batch, { onConflict: 'from_region,to_region,item_keyword' });
    if (error) {
      console.error(`Batch ${Math.floor(i / 50) + 1} error:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`  Batch ${Math.floor(i / 50) + 1}: inserted ${batch.length} rules (total: ${inserted})`);
    }
  }

  // Summary
  const { count } = await supabase
    .from('compliance_rules')
    .select('*', { count: 'exact', head: true });

  console.log(`\nDone. compliance_rules table now has ${count} rows.`);

  // Breakdown by route
  const { data: routes } = await supabase
    .from('compliance_rules')
    .select('from_region, to_region');
  if (routes) {
    const byRoute: Record<string, number> = {};
    for (const r of routes) {
      const k = `${r.from_region} → ${r.to_region}`;
      byRoute[k] = (byRoute[k] || 0) + 1;
    }
    console.log('\nRules by route:');
    for (const [route, n] of Object.entries(byRoute).sort()) {
      console.log(`  ${route}: ${n}`);
    }
  }
}

main().catch(console.error);
