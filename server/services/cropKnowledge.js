// Crop Agronomic Knowledge Base & Intelligent Predictor

const CROP_MODELS = {
  "Wheat": {
    total_days: 125,
    stages: [
      { name: "Sowing & Germination", start_day: 1, end_day: 10, tasks: ["Check seed emergence", "Ensure adequate soil moisture", "Bird scaring if needed"], irrigation: "Crown root initiation (CRI) check", harvest_indicators: "None" },
      { name: "Crown Root & Tillering", start_day: 11, end_day: 35, tasks: ["Inspect tillering count (4-6 per plant)", "First weeding / hoeing", "First top dressing with Nitrogen"], irrigation: "Critical irrigation at CRI (Day 21)", harvest_indicators: "None" },
      { name: "Jointing & Stem Elongation", start_day: 36, end_day: 60, tasks: ["Monitor stem strength", "Scout for yellow rust / aphid symptoms", "Second split fertilizer"], irrigation: "Irrigate if topsoil is dry > 3cm", harvest_indicators: "None" },
      { name: "Booting & Heading", start_day: 61, end_day: 75, tasks: ["Check ear emergence", "Inspect flag leaf health", "Watch for fungal spots"], irrigation: "Critical flowering irrigation", harvest_indicators: "Ear heads emerge" },
      { name: "Flowering & Anthesis", start_day: 76, end_day: 90, tasks: ["Check pollination completion", "Scout for loose smut / aphids", "Protect from hot dry winds"], irrigation: "Maintain light soil moisture", harvest_indicators: "Pollen shed complete" },
      { name: "Milk & Dough Stage", start_day: 91, end_day: 110, tasks: ["Check grain filling firmness", "Stop nitrogen application", "Prepare storage bags"], irrigation: "Terminal light irrigation (Milk stage)", harvest_indicators: "Grains become solid dough" },
      { name: "Maturity & Ripening", start_day: 111, end_day: 125, tasks: ["Monitor grain moisture (< 14%)", "Prepare harvesting equipment / sickles", "Clean threshing floor"], irrigation: "No irrigation", harvest_indicators: "Straw turns golden yellow, grain cracks between teeth" }
    ]
  },
  "Tomato": {
    total_days: 100,
    stages: [
      { name: "Nursery & Transplanting", start_day: 1, end_day: 15, tasks: ["Ensure seedling root establishment", "Light shading if hot", "Check seedling damping-off"], irrigation: "Daily light watering", harvest_indicators: "None" },
      { name: "Early Vegetative Growth", start_day: 16, end_day: 30, tasks: ["Apply basal fertilizer", "First hoeing & weeding", "Install support stakes"], irrigation: "Every 4-5 days", harvest_indicators: "None" },
      { name: "Flowering & Branching", start_day: 31, end_day: 48, tasks: ["Tie main stems to stakes", "Prune suckers", "Monitor for whitefly & leaf miner"], irrigation: "Regular even moisture (avoid flower drop)", harvest_indicators: "First flower clusters open" },
      { name: "Fruit Setting", start_day: 49, end_day: 68, tasks: ["Apply Calcium/Boron to prevent blossom end rot", "Check fruit borer damage", "Foliar micronutrients"], irrigation: "Critical fruit expansion watering", harvest_indicators: "Green marble-sized fruits" },
      { name: "Fruit Sizing & Ripening", start_day: 69, end_day: 88, tasks: ["Monitor colour break (breaker stage)", "Inspect fruit uniformity", "Bird and rodent protection"], irrigation: "Moderate (avoid fruit cracking)", harvest_indicators: "Fruits turn pale red / breaker stage" },
      { name: "Harvesting & Flushing", start_day: 89, end_day: 105, tasks: ["Harvest early morning into crates", "Sort into A/B/C grades", "Transfer to cold/shaded intake"], irrigation: "Light irrigation after each picking", harvest_indicators: "Uniform red firmness" }
    ]
  },
  "Onion": {
    total_days: 120,
    stages: [
      { name: "Transplanting & Establishment", start_day: 1, end_day: 15, tasks: ["Check seedling stand count", "Maintain bed moisture", "Watch for cutworms"], irrigation: "Frequent light irrigations", harvest_indicators: "None" },
      { name: "Vegetative Foliage Growth", start_day: 16, end_day: 45, tasks: ["Weeding and shallow interculture", "Top dress with Nitrogen & Potassium", "Scout for thrips"], irrigation: "Irrigate every 7-8 days", harvest_indicators: "None" },
      { name: "Bulb Initiation", start_day: 46, end_day: 75, tasks: ["Monitor neck thickening", "Apply Sulphur for pungency & storability", "Check purple blotch"], irrigation: "Critical bulb enlargement moisture", harvest_indicators: "Base begins swelling" },
      { name: "Bulb Development", start_day: 76, end_day: 105, tasks: ["Stop nitrogen feeding", "Inspect bulb firmness", "Watch for thrips under leaves"], irrigation: "Moderate regular watering", harvest_indicators: "Outer scales develop colour" },
      { name: "Maturity & Top Fall", start_day: 106, end_day: 120, tasks: ["Withhold irrigation 10-14 days before harvest", "Check neck softening", "Prepare curing field"], irrigation: "Strictly stop irrigation", harvest_indicators: "50-70% tops fall over, neck softens" }
    ]
  },
  "Potato": {
    total_days: 95,
    stages: [
      { name: "Sprouting & Emergence", start_day: 1, end_day: 18, tasks: ["Check shoot emergence", "Inspect tuber rot in heavy soils", "First ridge cleaning"], irrigation: "Pre-emergence light watering", harvest_indicators: "None" },
      { name: "Vegetative Growth", start_day: 19, end_day: 40, tasks: ["First earthing up around stems", "Top dress with nitrogen", "Scout for aphids (virus vector)"], irrigation: "Maintain 65-70% soil moisture", harvest_indicators: "None" },
      { name: "Tuber Initiation (Stolon Formation)", start_day: 41, end_day: 60, tasks: ["Second earthing up (prevent greening)", "Scout for early/late blight symptoms", "Apply Potassium"], irrigation: "Critical stage for tuber count", harvest_indicators: "Stolon tips swell" },
      { name: "Tuber Bulking", start_day: 61, end_day: 80, tasks: ["Keep tubers well covered from sunlight", "Monitor tuber size progression", "Blight protection sprays"], irrigation: "Uniform moisture (prevent cracks)", harvest_indicators: "Tubers reach marketable size" },
      { name: "Senescence & Skin Hardening", start_day: 81, end_day: 95, tasks: ["Dehaulming (cut foliage 10 days before harvest)", "Skin curing in soil", "Check skin peeling resistance"], irrigation: "Stop watering 12 days prior", harvest_indicators: "Foliage dies, tuber skin does not peel with thumb" }
    ]
  },
  "Rice": {
    total_days: 130,
    stages: [
      { name: "Nursery & Transplanting", start_day: 1, end_day: 20, tasks: ["Ensure shallow water depth (2-3 cm)", "Check seedling survival", "Apply zinc sulfate if deficient"], irrigation: "Continuous shallow standing water", harvest_indicators: "None" },
      { name: "Tillering Phase", start_day: 21, end_day: 50, tasks: ["Count tillers per hill", "First split urea top dressing", "Weed management / cono-weeder"], irrigation: "Maintain 3-5 cm water layer", harvest_indicators: "None" },
      { name: "Panicle Initiation & Stem Elongation", start_day: 51, end_day: 80, tasks: ["Check panicle formation inside stem", "Scout for stem borer / leaf folder", "Potash application"], irrigation: "Critical water requirement", harvest_indicators: "Panicle neck swollen" },
      { name: "Booting & Heading", start_day: 81, end_day: 98, tasks: ["Panicles fully emerge", "Monitor blast and sheath blight", "Avoid water deficit"], irrigation: "Keep standing water", harvest_indicators: "Panicles fully emerged" },
      { name: "Grain Filling & Milk Stage", start_day: 99, end_day: 115, tasks: ["Observe grain weight development", "Protect against gundhi bug", "Prepare drainage channels"], irrigation: "Alternate wetting and drying", harvest_indicators: "Milky liquid turns firm dough" },
      { name: "Ripening & Maturity", start_day: 116, end_day: 130, tasks: ["Drain field 10 days before harvest", "Test grain moisture (18-20%)", "Harvest when 85% grains turn golden"], irrigation: "Drain field completely", harvest_indicators: "Upper 80% grains golden, straw yellow" }
    ]
  },
  "Soybean": {
    total_days: 100,
    stages: [
      { name: "Germination & Emergence", start_day: 1, end_day: 10, tasks: ["Check root nodulation initiation", "Inspect seedling count", "Weeding"], irrigation: "Soil moisture at planting", harvest_indicators: "None" },
      { name: "Vegetative Growth", start_day: 11, end_day: 35, tasks: ["Check rhizobium root nodules (pink interior)", "Interculture weeding", "Scout for girdle beetle / semilooper"], irrigation: "Rainfed / light if dry spell", harvest_indicators: "None" },
      { name: "Flowering & Pod Formation", start_day: 36, end_day: 65, tasks: ["Critical moisture period", "Scout for spodoptera / pod borer", "Foliar boron spray"], irrigation: "Irrigate if dry spell occurs", harvest_indicators: "Small green pods visible" },
      { name: "Pod Filling", start_day: 66, end_day: 85, tasks: ["Observe seed size inside pods", "Monitor leaf yellowing", "Prevent pod shattering"], irrigation: "Maintain adequate moisture", harvest_indicators: "Seeds fill pod cavity" },
      { name: "Maturity & Harvest", start_day: 86, end_day: 100, tasks: ["Check leaf shed (>90%)", "Harvest when pods rattle when shaken", "Thresh at low cylinder speed"], irrigation: "No irrigation", harvest_indicators: "Leaves drop, pods brown, seeds rattle" }
    ]
  },
  "Cotton": {
    total_days: 160,
    stages: [
      { name: "Germination & Stand Establishment", start_day: 1, end_day: 20, tasks: ["Gap filling and thinning to single plant", "Check jassid and thrips", "Weed control"], irrigation: "Light post-sowing irrigation", harvest_indicators: "None" },
      { name: "Square Formation (Budding)", start_day: 21, end_day: 55, tasks: ["Inspect floral buds (squares)", "Install pheromone traps for pink bollworm", "Nutrient spraying"], irrigation: "Irrigate every 10-12 days", harvest_indicators: "First floral squares visible" },
      { name: "Flowering & Boll Setting", start_day: 56, end_day: 100, tasks: ["Monitor boll setting rate", "Inspect for pink bollworm larvae", "Magnesium and Potassium spray"], irrigation: "Critical peak water requirement", harvest_indicators: "Young bolls developing" },
      { name: "Boll Development", start_day: 101, end_day: 135, tasks: ["Protect against boll rot in humid weather", "Maintain clean inter-row spaces", "Check boll sizing"], irrigation: "Moderate watering", harvest_indicators: "Bolls reach maximum size" },
      { name: "Boll Bursting & Picking", start_day: 136, end_day: 160, tasks: ["Pick fully burst bolls in dry sunny hours", "Avoid trash/leaf contamination", "Store in dry clean room"], irrigation: "Stop irrigation", harvest_indicators: "Fluffy white cotton bolls burst open" }
    ]
  },
  "Maize": {
    total_days: 105,
    stages: [
      { name: "Emergence & Early Whorl", start_day: 1, end_day: 20, tasks: ["Thinning to proper plant spacing", "Check Fall Armyworm (FAW) egg masses", "Weed control"], irrigation: "Initial establishment watering", harvest_indicators: "None" },
      { name: "Rapid Vegetative Whorl", start_day: 21, end_day: 45, tasks: ["Apply nitrogen top-dressing", "Inspect whorls for FAW frass", "Earthing up"], irrigation: "Irrigate every 8-10 days", harvest_indicators: "None" },
      { name: "Tasseling & Silking", start_day: 46, end_day: 70, tasks: ["Pollen shedding from tassels", "Inspect silk emergence", "Critical moisture stage"], irrigation: "Peak critical irrigation", harvest_indicators: "Silks emerge from cob" },
      { name: "Grain Filling (Blister to Dent)", start_day: 71, end_day: 90, tasks: ["Monitor kernel milk line progression", "Protect from birds", "Check cob fullness"], irrigation: "Maintain good soil moisture", harvest_indicators: "Kernels enter dent stage" },
      { name: "Black Layer Maturity", start_day: 91, end_day: 105, tasks: ["Check black layer at base of kernel", "Husks turn dry and papery", "Harvest cobs"], irrigation: "No irrigation", harvest_indicators: "Black layer forms at kernel tip, dry husks" }
    ]
  },
  "Mustard": {
    total_days: 110,
    stages: [
      { name: "Germination & Seedling", start_day: 1, end_day: 15, tasks: ["Thinning to 10-15 cm spacing", "Check mustard sawfly larvae", "Weed management"], irrigation: "Pre-sowing irrigation", harvest_indicators: "None" },
      { name: "Rosette & Branching", start_day: 16, end_day: 40, tasks: ["First interculture & hoeing", "Nitrogen top-dress", "Scout for painted bug"], irrigation: "First irrigation at 30-35 days", harvest_indicators: "None" },
      { name: "Flowering", start_day: 41, end_day: 70, tasks: ["Monitor aphid colonies (Lipaphis erysimi)", "Protect pollinating honeybees", "Foliar spray if aphid threshold crossed"], irrigation: "Secondary irrigation at flowering", harvest_indicators: "Bright yellow flowers" },
      { name: "Pod (Siliqua) Formation", start_day: 71, end_day: 95, tasks: ["Observe pod filling", "Check for white rust / downy mildew", "Inspect seed development"], irrigation: "Pod development irrigation", harvest_indicators: "Green siliquae form" },
      { name: "Maturity & Harvest", start_day: 96, end_day: 110, tasks: ["Harvest in early morning (prevent shattering)", "Bundle and dry in sun", "Thresh when pods crack easily"], irrigation: "Stop irrigation", harvest_indicators: "Pods turn yellowish-brown, seeds darken" }
    ]
  },
  "Chilli": {
    total_days: 120,
    stages: [
      { name: "Transplanting & Establishment", start_day: 1, end_day: 20, tasks: ["Check root establishment", "Drench for root rot prevention", "Light watering"], irrigation: "Light watering every 3 days", harvest_indicators: "None" },
      { name: "Vegetative Branching", start_day: 21, end_day: 45, tasks: ["Weeding and hoeing", "Top dress with balanced NPK", "Monitor for thrips and mites (leaf curling)"], irrigation: "Regular weekly irrigation", harvest_indicators: "None" },
      { name: "Flowering & First Pod Set", start_day: 46, end_day: 70, tasks: ["Monitor flower drop", "Spray micronutrients", "Scout for fruit borer"], irrigation: "Maintain consistent moisture", harvest_indicators: "First green chillies develop" },
      { name: "Fruiting & Harvest Flushes", start_day: 71, end_day: 120, tasks: ["Pick mature green or red chillies", "Post-picking light fertilizer", "Sun dry red chillies on clean tarpaulins"], irrigation: "Water after each harvest flush", harvest_indicators: "Chillies reach full length & firmness" }
    ]
  },
  // Default fallback for any custom or "Other" crop
  "Other": {
    total_days: 100,
    stages: [
      { name: "Sowing & Germination", start_day: 1, end_day: 15, tasks: ["Ensure proper seed germination", "Check seedling emergence", "Maintain moisture"], irrigation: "Initial establishment watering", harvest_indicators: "None" },
      { name: "Vegetative Growth", start_day: 16, end_day: 45, tasks: ["Interculture and weeding", "Apply recommended fertilizers", "Scout for common pests"], irrigation: "Regular interval irrigation", harvest_indicators: "None" },
      { name: "Flowering & Development", start_day: 46, end_day: 75, tasks: ["Monitor flowering and fruit/seed setting", "Inspect crop health", "Protect from heat/moisture stress"], irrigation: "Critical development irrigation", harvest_indicators: "Fruit / grain formation" },
      { name: "Maturity & Harvest", start_day: 76, end_day: 100, tasks: ["Check harvest maturity indicators", "Prepare harvesting equipment and storage", "Harvest at optimal moisture"], irrigation: "Reduce/stop irrigation", harvest_indicators: "Produce reaches physiological maturity" }
    ]
  }
};

function getCropModel(cropName) {
  if (!cropName) return CROP_MODELS["Other"];
  const matched = Object.keys(CROP_MODELS).find(k => k.toLowerCase() === cropName.toLowerCase());
  return matched ? CROP_MODELS[matched] : CROP_MODELS["Other"];
}

function calculateCropProgress(sowingDate, totalDays) {
  const sown = new Date(sowingDate);
  const now = new Date();
  const diffTime = now - sown;
  const currentDay = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
  const progressPct = Math.min(100, Math.round((currentDay / totalDays) * 100));
  return { currentDay, progressPct };
}

function getCurrentStage(cropModel, currentDay) {
  for (const s of cropModel.stages) {
    if (currentDay >= s.start_day && currentDay <= s.end_day) {
      return s;
    }
  }
  return cropModel.stages[cropModel.stages.length - 1];
}

// Initial AI Harvest Prediction
function generateInitialHarvestPrediction(cropName, variety, sowingDate, soilType, irrigationMethod) {
  const model = getCropModel(cropName);
  const baseDuration = model.total_days;
  
  // Variety modifier: short duration vs long duration varieties
  let varOffset = 0;
  if (variety) {
    const v = variety.toLowerCase();
    if (v.includes('early') || v.includes('hybrid') || v.includes('short')) varOffset -= 6;
    if (v.includes('late') || v.includes('desi') || v.includes('long')) varOffset += 8;
  }

  // Soil modifier: black cotton soils hold moisture longer vs light sandy
  let soilOffset = 0;
  if (soilType) {
    const s = soilType.toLowerCase();
    if (s.includes('sandy')) soilOffset -= 3;
    if (s.includes('clay') || s.includes('black')) soilOffset += 4;
  }

  const effectiveDuration = baseDuration + varOffset + soilOffset;

  const sown = new Date(sowingDate);
  const mostLikely = new Date(sown);
  mostLikely.setDate(mostLikely.getDate() + effectiveDuration);

  const startWindow = new Date(mostLikely);
  startWindow.setDate(startWindow.getDate() - 5);

  const endWindow = new Date(mostLikely);
  endWindow.setDate(endWindow.getDate() + 5);

  const startStr = startWindow.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const endStr = endWindow.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const mostLikelyStr = mostLikely.toISOString().split('T')[0];

  const reason = `Estimated based on ${cropName} (${variety || 'standard variety'}), sown on ${sowingDate}, growing in ${soilType || 'alluvial/loamy'} soil with ${irrigationMethod || 'surface'} irrigation.`;

  return {
    total_duration_days: effectiveDuration,
    estimated_harvest_start: startWindow.toISOString().split('T')[0],
    estimated_harvest_end: endWindow.toISOString().split('T')[0],
    harvest_window_display: `${startStr} – ${endStr}`,
    most_likely_harvest_date: mostLikelyStr,
    prediction_confidence: 0.84,
    prediction_reason: reason
  };
}

// Dynamic Harvest Prediction adjustment based on daily observations and pace
function evaluateDynamicPrediction(cropCycle, recentLogs) {
  // If recent logs indicate recurring pest/disease or poor health, delay by 4-7 days
  let delayDays = 0;
  let delayReason = '';

  const poorHealthCount = recentLogs.filter(l => l.health_status === 'Poor').length;
  const pestCount = recentLogs.filter(l => l.pest_observation === 'Observed').length;

  if (poorHealthCount >= 3) {
    delayDays += 5;
    delayReason = 'Crop growth slowed due to sub-optimal health observations.';
  } else if (pestCount >= 2) {
    delayDays += 4;
    delayReason = 'Growth pace affected by observed pest incidence.';
  }

  if (delayDays > 0) {
    const currentTarget = new Date(cropCycle.most_likely_harvest_date);
    currentTarget.setDate(currentTarget.getDate() + delayDays);

    const startWin = new Date(currentTarget);
    startWin.setDate(startWin.getDate() - 5);

    const endWin = new Date(currentTarget);
    endWin.setDate(endWin.getDate() + 5);

    return {
      updated: true,
      new_most_likely: currentTarget.toISOString().split('T')[0],
      new_start: startWin.toISOString().split('T')[0],
      new_end: endWin.toISOString().split('T')[0],
      new_window_display: `${startWin.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${endWin.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
      reason: delayReason
    };
  }

  return { updated: false };
}

// AI Image Crop Symptom Screening Simulation
function analyzeCropPhoto(cropName) {
  const crop = (cropName || 'Wheat').toLowerCase();

  if (crop.includes('wheat')) {
    return {
      observation: "Slight chlorosis (yellowing) with small powdery orange pustules visible along leaf veins.",
      possible_issue: "Possible early yellow rust (Puccinia striiformis) or nitrogen deficiency symptoms detected.",
      severity: "Medium",
      confidence: 0.81,
      recommendation: "Inspect underside of 10-15 random flag leaves. If orange powdery spores rub off onto fingers, consider a prophylactic propiconazole/mancozeb spray and ensure no stagnant water."
    };
  } else if (crop.includes('tomato')) {
    return {
      observation: "Concentric brown-black circular rings with yellow halos visible on lower older leaves.",
      possible_issue: "Possible early blight (Alternaria solani) or nutrient stress detected.",
      severity: "Medium",
      confidence: 0.86,
      recommendation: "Remove and safely discard affected lower foliage. Avoid overhead sprinkler irrigation to keep leaves dry, and consider copper oxychloride or biological Trichoderma application."
    };
  } else if (crop.includes('onion')) {
    return {
      observation: "Silvery white streaks and curling observed near the leaf axis.",
      possible_issue: "Possible thrips damage (Thrips tabaci) detected.",
      severity: "Low",
      confidence: 0.79,
      recommendation: "Install yellow or blue sticky traps (10 per acre). Spray neem seed kernel extract (NSKE 5%) or spinosad if infestation exceeds 10 thrips per plant."
    };
  }

  return {
    observation: "General foliage appearance shows normal green pigmentation with slight marginal leaf curl.",
    possible_issue: "Minor heat or moisture stress suspected.",
    severity: "Low",
    confidence: 0.75,
    recommendation: "Check root-zone moisture level before afternoon. Ensure adequate irrigation interval and verify no sucking pests beneath leaves."
  };
}

module.exports = {
  CROP_MODELS,
  getCropModel,
  calculateCropProgress,
  getCurrentStage,
  generateInitialHarvestPrediction,
  evaluateDynamicPrediction,
  analyzeCropPhoto
};
