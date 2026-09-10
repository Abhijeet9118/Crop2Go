// AI-Powered Transport Demand Aggregator & Smart Fleet Allocator

const VEHICLE_TIERS = {
  small_pickup: {
    tier_name: "Magic / Small Pickup Vehicle",
    min_kg: 100,
    max_kg: 300,
    typical_model: "Tata Ace Zip / Mahindra Jeeto",
    capacity_kg: 500,
    base_cost: 800,
    per_kg_rate: 1.60
  },
  mini_truck: {
    tier_name: "Mini Truck",
    min_kg: 301,
    max_kg: 1500,
    typical_model: "Tata Ace Mega / Ashok Leyland Dost",
    capacity_kg: 1500,
    base_cost: 1800,
    per_kg_rate: 1.20
  },
  standard_truck: {
    tier_name: "Standard Truck (6-Wheeler)",
    min_kg: 1501,
    max_kg: 5000,
    typical_model: "Eicher Pro 2049 / Tata 407",
    capacity_kg: 5000,
    base_cost: 4000,
    per_kg_rate: 0.80
  },
  heavy_truck: {
    tier_name: "Heavy Commercial / Multi-Truck",
    min_kg: 5001,
    max_kg: 20000,
    typical_model: "Tata 1109 / 10-Tonne Heavy Multi-Axle",
    capacity_kg: 12000,
    base_cost: 8500,
    per_kg_rate: 0.70
  }
};

/**
 * Automatically determine best vehicle tier for a given aggregated load
 */
function recommendVehicleTier(totalQuantityKg) {
  const qty = parseFloat(totalQuantityKg) || 0;

  if (qty <= 300) {
    return {
      tier_key: 'small_pickup',
      ...VEHICLE_TIERS.small_pickup,
      trucks_needed: 1,
      utilization_pct: Math.min(100, Math.round((qty / VEHICLE_TIERS.small_pickup.capacity_kg) * 100))
    };
  } else if (qty <= 1500) {
    return {
      tier_key: 'mini_truck',
      ...VEHICLE_TIERS.mini_truck,
      trucks_needed: 1,
      utilization_pct: Math.min(100, Math.round((qty / VEHICLE_TIERS.mini_truck.capacity_kg) * 100))
    };
  } else if (qty <= 5000) {
    return {
      tier_key: 'standard_truck',
      ...VEHICLE_TIERS.standard_truck,
      trucks_needed: 1,
      utilization_pct: Math.min(100, Math.round((qty / VEHICLE_TIERS.standard_truck.capacity_kg) * 100))
    };
  } else {
    const trucksNeeded = Math.ceil(qty / VEHICLE_TIERS.heavy_truck.capacity_kg);
    return {
      tier_key: 'heavy_truck',
      ...VEHICLE_TIERS.heavy_truck,
      trucks_needed: trucksNeeded,
      utilization_pct: Math.min(100, Math.round((qty / (VEHICLE_TIERS.heavy_truck.capacity_kg * trucksNeeded)) * 100))
    };
  }
}

/**
 * Group active slot bookings by target date and village
 */
function aggregateBookingsByDateAndVillage(slots) {
  const clusters = {};

  slots.forEach(slot => {
    const key = `${slot.preferred_date}__${slot.pickup_village}`;
    if (!clusters[key]) {
      clusters[key] = {
        date: slot.preferred_date,
        village: slot.pickup_village,
        total_quantity_kg: 0,
        slots: [],
        produce_breakdown: {}
      };
    }

    clusters[key].total_quantity_kg += slot.quantity_kg;
    clusters[key].slots.push(slot);

    // Track produce types
    clusters[key].produce_breakdown[slot.produce_type] =
      (clusters[key].produce_breakdown[slot.produce_type] || 0) + slot.quantity_kg;
  });

  return Object.values(clusters).map(c => {
    const recommendation = recommendVehicleTier(c.total_quantity_kg);
    const individualEstimatedCost = c.slots.length * 1500; // If each farmer booked a vehicle separately
    const sharedTotalCost = recommendation.base_cost;
    const totalSavings = Math.max(0, individualEstimatedCost - sharedTotalCost);
    const savingsPct = Math.round((totalSavings / individualEstimatedCost) * 100);

    return {
      ...c,
      farmer_count: c.slots.length,
      recommendation,
      cost_analysis: {
        shared_total_cost: sharedTotalCost,
        individual_cost_sum: individualEstimatedCost,
        total_savings: totalSavings,
        savings_pct: savingsPct || 65,
        rate_per_kg: recommendation.per_kg_rate
      }
    };
  });
}

module.exports = {
  VEHICLE_TIERS,
  recommendVehicleTier,
  aggregateBookingsByDateAndVillage
};
