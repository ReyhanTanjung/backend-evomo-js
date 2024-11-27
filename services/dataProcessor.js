// services/dataProcessor.js
const previousData = {};

class DataProcessor {
  constructor(locations) {
    // Initialize previous data for each location
    locations.forEach(location => {
      previousData[location] = [null, null];
    });
  }

  calculateDifference(location, currentData) {
    const previous = previousData[location][0];
    const difference = {};

    if (previous !== null) {
      difference.active_energy_import_diff = currentData.active_energy_import - previous.active_energy_import;
      difference.active_energy_export_diff = currentData.active_energy_export - previous.active_energy_export;
      difference.reactive_energy_import_diff = currentData.reactive_energy_import - previous.reactive_energy_import;
      difference.reactive_energy_export_diff = currentData.reactive_energy_export - previous.reactive_energy_export;
      difference.apparent_energy_import_diff = currentData.apparent_energy_import - previous.apparent_energy_import;
      difference.apparent_energy_export_diff = currentData.apparent_energy_export - previous.apparent_energy_export;

      previousData[location] = [currentData, null];
    } else {
      previousData[location] = [currentData, null];
    }

    return difference;
  }
}

module.exports = DataProcessor;