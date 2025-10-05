import React, { useState, useEffect } from 'react';
import { ISchoolInfo } from '../../electron/types';

const initialInfoState: ISchoolInfo = {
    school_name: '', street_address: '', zip_code: '',
    bank_name: '', iban: '', blz: '',
};

export const SchoolInfoManager = () => {
    const [info, setInfo] = useState<ISchoolInfo>(initialInfoState);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        window.api.getSchoolInfo().then(data => {
            if (data) setInfo(data);
        });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInfo({ ...info, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await window.api.updateSchoolInfo(info);
        setSaveMessage('Einstellungen erfolgreich gespeichert!');
        setTimeout(() => setSaveMessage(''), 3000); // Hide message after 3 seconds
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2>Reitanlage Garnzell Einstellungen</h2>
            <p>Informationen die auf Karten etc. angezeigt werden können</p>
            <form onSubmit={handleSubmit} className="form-section" style={{ padding: '20px' }}>
                <h4>Details</h4>
                <label>Name</label>
                <input name="school_name" value={info.school_name} onChange={handleChange} placeholder="e.g., Reitanlage Garnzell" />
                <label>Adresse</label>
                <input name="street_address" value={info.street_address} onChange={handleChange} placeholder="e.g., Musterstraße 1" />
                <label>Ort und Postleitzahl</label>
                <input name="zip_code" value={info.zip_code} onChange={handleChange} placeholder="e.g., 12345 Musterstadt" />

                <h4 style={{marginTop: '30px'}}>Bankdaten</h4>
                <label>Bank Name</label>
                <input name="bank_name" value={info.bank_name} onChange={handleChange} />
                <label>IBAN</label>
                <input name="iban" value={info.iban} onChange={handleChange} />
                <label>BLZ</label>
                <input name="blz" value={info.blz} onChange={handleChange} />

                <button type="submit" className="submit-btn" style={{ marginTop: '20px' }}>Einstellung speichern</button>
                {saveMessage && <p style={{ color: 'green', marginTop: '10px' }}>{saveMessage}</p>}
            </form>
        </div>
    );
};