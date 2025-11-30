import { useState, useEffect } from 'react';

export const useUserProfile = () => {
    const [userProfile, setUserProfile] = useState({
        nombre: '',
        calle: '',
        manzana: '',
        lote: '',
        casa: '',
        ubicacion: '',
        lat: null,
        lng: null,
        telefono: '',
        telefono_verificado: false,
        userId: null,
        photo: null
    });

    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const savedProfile = localStorage.getItem('vecivendo_user_profile');
        if (savedProfile) {
            try {
                setUserProfile(JSON.parse(savedProfile));
            } catch (e) {
                console.error("Error parsing user profile", e);
            }
        }
    }, []);

    const updateUserProfile = (newProfile) => {
        setUserProfile(prev => {
            const updated = { ...prev, ...newProfile };
            setIsDirty(true);
            return updated;
        });
    };

    const saveUserProfile = () => {
        localStorage.setItem('vecivendo_user_profile', JSON.stringify(userProfile));
        setIsDirty(false);
    };

    return {
        userProfile,
        updateUserProfile,
        saveUserProfile,
        isDirty
    };
};
