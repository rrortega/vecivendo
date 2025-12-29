import { useState, useEffect } from 'react';

/**
 * Hook para manejar el perfil del usuario
 * Separa datos globales (nombre, teléfono) de datos específicos del residencial (dirección, ubicación)
 * @param {string} residencialSlug - Slug del residencial actual
 */
export const useUserProfile = (residencialSlug = null) => {
    // Datos globales del usuario (no cambian entre residenciales)
    const [globalData, setGlobalData] = useState({
        nombre: '',
        telefono: '',
        telefono_verificado: false,
        userId: null,
        photo: null
    });

    // Datos específicos del residencial (cambian por residencial)
    const [residentialData, setResidentialData] = useState({
        calle: '',
        manzana: '',
        lote: '',
        casa: '',
        ubicacion: '',
        lat: null,
        lng: null
    });

    const [isDirty, setIsDirty] = useState(false);

    // Cargar datos globales al montar
    useEffect(() => {
        const savedGlobalData = localStorage.getItem('vecivendo_user_global');
        if (savedGlobalData) {
            try {
                setGlobalData(JSON.parse(savedGlobalData));
            } catch (e) {
                console.error("Error parsing global user data", e);
            }
        }
    }, []);

    // Cargar datos del residencial cuando cambia el slug
    useEffect(() => {
        if (residencialSlug) {
            const savedResidentialData = localStorage.getItem(`vecivendo_user_residential_${residencialSlug}`);
            if (savedResidentialData) {
                try {
                    setResidentialData(JSON.parse(savedResidentialData));
                } catch (e) {
                    console.error("Error parsing residential user data", e);
                }
            } else {
                // Si no hay datos para este residencial, resetear a valores por defecto
                setResidentialData({
                    calle: '',
                    manzana: '',
                    lote: '',
                    casa: '',
                    ubicacion: '',
                    lat: null,
                    lng: null
                });
            }
        }
    }, [residencialSlug]);

    // Combinar datos globales y del residencial en un solo objeto
    const userProfile = {
        ...globalData,
        ...residentialData
    };

    const updateUserProfile = (newProfile) => {
        // Separar las actualizaciones en globales y residenciales
        const globalFields = ['nombre', 'telefono', 'telefono_verificado', 'userId', 'photo'];
        const residentialFields = ['calle', 'manzana', 'lote', 'casa', 'ubicacion', 'lat', 'lng'];

        const globalUpdates = {};
        const residentialUpdates = {};

        Object.keys(newProfile).forEach(key => {
            if (globalFields.includes(key)) {
                globalUpdates[key] = newProfile[key];
            } else if (residentialFields.includes(key)) {
                residentialUpdates[key] = newProfile[key];
            }
        });

        if (Object.keys(globalUpdates).length > 0) {
            setGlobalData(prev => ({ ...prev, ...globalUpdates }));
        }

        if (Object.keys(residentialUpdates).length > 0) {
            setResidentialData(prev => ({ ...prev, ...residentialUpdates }));
        }

        setIsDirty(true);
    };

    const saveUserProfile = (newGlobalData = null, newResidentialData = null) => {
        const globalToSave = newGlobalData || globalData;
        const residentialToSave = newResidentialData || residentialData;

        // Guardar datos globales
        localStorage.setItem('vecivendo_user_global', JSON.stringify(globalToSave));

        // Guardar datos del residencial si tenemos un slug
        if (residencialSlug) {
            localStorage.setItem(`vecivendo_user_residential_${residencialSlug}`, JSON.stringify(residentialToSave));
        }

        setIsDirty(false);
    };

    return {
        userProfile,
        globalData,
        residentialData,
        setGlobalData,
        setResidentialData,
        updateUserProfile,
        saveUserProfile,
        isDirty
    };
};

