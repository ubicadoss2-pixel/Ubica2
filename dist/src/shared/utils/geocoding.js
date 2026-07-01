"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geocodeAddress = void 0;
const geocodeAddress = async (addressLine, postalCode, city) => {
    if (!addressLine && !postalCode && !city) {
        return { latitude: null, longitude: null };
    }
    // Prepara un query más preciso incluyendo ciudad y país
    const queryParts = [addressLine, city, "Colombia"].filter(Boolean);
    const query = queryParts.join(", ");
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
            headers: {
                'User-Agent': 'Ubica2Pro/1.1'
            }
        });
        const data = await res.json();
        if (data && data.length > 0) {
            return {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon)
            };
        }
    }
    catch (err) {
        console.error('[GEOCODING] Error calling Nominatim:', err);
    }
    // Fallback a Armenia (Quindío) si la búsqueda falla o no devuelve datos
    // Esto previene que se asigne (0,0) o Bogotá por error sistémico en Quindío
    return { latitude: 4.54013, longitude: -75.6657 };
};
exports.geocodeAddress = geocodeAddress;
