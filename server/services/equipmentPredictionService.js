/**
 * AI Equipment Requirement Prediction Service
 * Analyzes farmer's active crops, growth stage, and sowing date to estimate
 * upcoming machinery needs, realistic requirement windows, and advance booking alerts.
 */

function generateEquipmentPredictions(farmerCrops) {
  if (!Array.isArray(farmerCrops) || farmerCrops.length === 0) {
    return [];
  }

  const recommendations = [];

  for (const crop of farmerCrops) {
    const cropName = (crop.crop_name || '').toLowerCase();
    const sowingDate = new Date(crop.sowing_date || Date.now());
    const currentDay = parseInt(crop.current_day) || 30;
    const totalDays = parseInt(crop.total_duration_days) || 120;
    const daysRemaining = Math.max(0, totalDays - currentDay);
    const area = parseFloat(crop.area_acres) || 3.0;

    // 1. Harvesting Machinery Prediction (Combine Harvester / Thresher)
    if (cropName.includes('wheat') || cropName.includes('rice') || cropName.includes('paddy') || cropName.includes('soybean')) {
      // If within 35 days of harvest or past day 75
      const harvestDate = new Date(sowingDate.getTime() + totalDays * 24 * 3600 * 1000);
      const windowStart = new Date(harvestDate.getTime() - 4 * 24 * 3600 * 1000);
      const windowEnd = new Date(harvestDate.getTime() + 4 * 24 * 3600 * 1000);

      const bookingLeadDays = 7;
      const recommendedBookStart = new Date(windowStart.getTime() - bookingLeadDays * 24 * 3600 * 1000);
      const recommendedBookEnd = new Date(windowStart.getTime() - 2 * 24 * 3600 * 1000);

      const formatWindow = (d1, d2) => {
        const m1 = d1.toLocaleString('en-IN', { month: 'short', day: 'numeric' });
        const m2 = d2.toLocaleString('en-IN', { month: 'short', day: 'numeric' });
        return `${m1} – ${m2}`;
      };

      const machineName = cropName.includes('rice') ? 'Paddy Combine Harvester' : 'Combine Harvester (Multi-Crop)';

      recommendations.push({
        id: `REC-EQ-${crop.id}-1`,
        crop_id: crop.id,
        crop_name: crop.crop_name,
        variety: crop.variety,
        area_acres: area,
        equipment_name: machineName,
        equipment_type: 'harvester',
        expected_window: formatWindow(windowStart, windowEnd),
        recommended_booking_window: formatWindow(recommendedBookStart, recommendedBookEnd),
        lead_time_days: bookingLeadDays,
        reason: `Your ${crop.crop_name} crop (${area} acres) is on Day ${currentDay} of ${totalDays} and approaching harvesting stage. High demand for combine harvesters occurs during local harvest; booking approximately 1 week before ensures machine availability.`,
        confidence: 'High (Based on crop maturity cycle)',
        approx_rate: '₹1,600 / hour',
        urgency: daysRemaining <= 14 ? 'high' : 'medium'
      });
    }

    // 2. Potato / Tuber Harvester or Digger
    if (cropName.includes('potato') || cropName.includes('onion')) {
      const harvestDate = new Date(sowingDate.getTime() + totalDays * 24 * 3600 * 1000);
      const windowStart = new Date(harvestDate.getTime() - 5 * 24 * 3600 * 1000);
      const windowEnd = new Date(harvestDate.getTime() + 3 * 24 * 3600 * 1000);
      const bookDate = new Date(windowStart.getTime() - 6 * 24 * 3600 * 1000);

      const formatD = (d) => d.toLocaleString('en-IN', { month: 'short', day: 'numeric' });

      recommendations.push({
        id: `REC-EQ-${crop.id}-2`,
        crop_id: crop.id,
        crop_name: crop.crop_name,
        variety: crop.variety,
        area_acres: area,
        equipment_name: cropName.includes('potato') ? 'Potato Digger & Elevator' : 'Tractor Cultivator & Bed Digger',
        equipment_type: 'harvester',
        expected_window: `${formatD(windowStart)} – ${formatD(windowEnd)}`,
        recommended_booking_window: `By ${formatD(bookDate)}`,
        lead_time_days: 6,
        reason: `For ${area} acres of ${crop.crop_name}, automated tuber lifting saves up to 70% manual labour costs and minimizes tuber slicing cuts. Recommended booking lead time: 6 days.`,
        confidence: 'Moderate-High',
        approx_rate: '₹1,200 / hour',
        urgency: daysRemaining <= 18 ? 'high' : 'medium'
      });
    }

    // 3. Mid-Cycle Crop Protection (Sprayers & Boom Sprayers)
    if (currentDay >= 25 && currentDay <= 70) {
      const sprayStart = new Date(Date.now() + 5 * 24 * 3600 * 1000);
      const sprayEnd = new Date(Date.now() + 10 * 24 * 3600 * 1000);
      const formatD = (d) => d.toLocaleString('en-IN', { month: 'short', day: 'numeric' });

      recommendations.push({
        id: `REC-EQ-${crop.id}-3`,
        crop_id: crop.id,
        crop_name: crop.crop_name,
        variety: crop.variety,
        area_acres: area,
        equipment_name: 'Tractor-Mounted Boom Sprayer (500L)',
        equipment_type: 'sprayer',
        expected_window: `${formatD(sprayStart)} – ${formatD(sprayEnd)}`,
        recommended_booking_window: '3–5 days in advance',
        lead_time_days: 4,
        reason: `${crop.crop_name} is in its active vegetative growth stage. Uniform canopy foliar nutrition and pest prophylactic spraying will protect yield potential.`,
        confidence: 'High',
        approx_rate: '₹600 / hour',
        urgency: 'medium'
      });
    }
  }

  // If no specific recommendations derived from active crops, provide generalized farm machinery guidance
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'REC-EQ-GEN-1',
      crop_name: 'Multi-Crop / Land Preparation',
      equipment_name: '45 HP Mahindra Tractor with Rotavator',
      equipment_type: 'tractor',
      expected_window: 'Upcoming Sowing Season',
      recommended_booking_window: '3–5 days before field prep',
      lead_time_days: 5,
      reason: 'Standard seedbed preparation and fine soil tilth for upcoming crop rotation.',
      confidence: 'Moderate',
      approx_rate: '₹900 / hour',
      urgency: 'low'
    });
  }

  return recommendations;
}

module.exports = { generateEquipmentPredictions };
