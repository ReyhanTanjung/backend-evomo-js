/**
 * Data Processor Module
 * @module services/dataProcessor
 * @description Calculates energy consumption differences across multiple locations
 * Tracks and computes incremental changes in various energy metrics
 */

// Storage for previous data state across locations
const previousData = {};

/**
 * DataProcessor: Manages energy data difference calculations
 * @class
 * @description Tracks and calculates incremental changes in energy metrics for different locations
 */
class DataProcessor {
  /**
   * Create a DataProcessor instance
   * @constructor
   * @param {string[]} locations - Array of location identifiers to track
   * 
   */
  constructor(locations) {
    // Initialize previous data for each location
    locations.forEach(location => {
      previousData[location] = [null, null];
    });
  }

  /**
   * Calculate energy consumption differences for a specific location
   * @method
   * @param {string} location - Identifier for the location being processed
   * @param {Object} currentData - Current energy consumption data
   * @returns {Object} Calculated differences in energy metrics
   * 
   * @property {number} active_energy_import_diff - Difference in active energy import
   * @property {number} active_energy_export_diff - Difference in active energy export
   * @property {number} reactive_energy_import_diff - Difference in reactive energy import
   * @property {number} reactive_energy_export_diff - Difference in reactive energy export
   * @property {number} apparent_energy_import_diff - Difference in apparent energy import
   * @property {number} apparent_energy_export_diff - Difference in apparent energy export
   * 
   * @example
   * const differences = processor.calculateDifference('site1', {
   *   active_energy_import: 1000,
   *   active_energy_export: 200,
   *   // ... other energy metrics
   * });
   */
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