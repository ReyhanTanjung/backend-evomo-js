// config/topics.js
const locationMapping = {
    'v2.0/subs/APP64f7e28a5964d54552/DEV650bfd4fb68de46441': 'Chiller_Witel_Jaksel',
    'v2.0/subs/APP64f7e28a5964d54552/DEV650c04ed6097879912': 'Lift_Witel_Jaksel', 
    'v2.0/subs/APP64f7e28a5964d54552/DEV650bfd518fdbd25357': 'Lift_OPMC',
    'v2.0/subs/APP64f7e28a5964d54552/DEV650bfd505a3a394189': 'AHU_Lantai_2'
  };
  
  const topics = Object.keys(locationMapping);
  
  module.exports = {
    locationMapping,
    topics
  };