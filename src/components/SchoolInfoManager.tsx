import React, { useState, useEffect } from 'react';
import { ISchoolInfo } from '../../electron/types';

const initialInfoState: ISchoolInfo = {
    school_name: '', street_address: '', zip_code: '',
    bank_name: '', iban: '', blz: '', phone_number: '', fax: '',
    price_10_card_members: '', price_10_card_nonMembers: '',
    price_10_card_youth_members: '', price_10_card_youth_nonMembers: ''
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
        const infoToSave = {
            ...info,
            price_10_card_members: Number(info.price_10_card_members) || 0,
            price_10_card_nonMembers: Number(info.price_10_card_nonMembers) || 0,
            price_10_card_youth_members: Number(info.price_10_card_youth_members) || 0,
            price_10_card_youth_nonMembers: Number(info.price_10_card_youth_nonMembers) || 0,
        };
        await window.api.updateSchoolInfo(infoToSave as ISchoolInfo);
        setSaveMessage('Einstellungen erfolgreich gespeichert!');
        setTimeout(() => setSaveMessage(''), 6000);
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2>Einstellungen</h2>
            <p>Informationen die auf Karten etc. angezeigt werden können</p>
            <form onSubmit={handleSubmit} className="form-section" style={{padding: '20px'}}>
                <h4>Details</h4>
                <label>Name</label>
                <input name="school_name" value={info.school_name} onChange={handleChange}
                       placeholder="e.g., Reitanlage Garnzell"/>
                <label>Adresse</label>
                <input name="street_address" value={info.street_address} onChange={handleChange}
                       placeholder="e.g., Musterstraße 1"/>
                <label>Ort und Postleitzahl</label>
                <input name="zip_code" value={info.zip_code} onChange={handleChange}
                       placeholder="e.g., 12345 Musterstadt"/>

                <label>Telefonnummer</label>
                <input name="phone_number" value={info.phone_number} onChange={handleChange}
                       placeholder="e.g., 089 / 123 456"/>

                <h4 style={{marginTop: '30px'}}>Bankdaten</h4>
                <label>Bank Name</label>
                <input name="bank_name" value={info.bank_name} onChange={handleChange}/>
                <label>IBAN</label>
                <input name="iban" value={info.iban} onChange={handleChange} placeholder="DE12 3456 7894"/>
                <label>BLZ</label>
                <input name="blz" value={info.blz} onChange={handleChange}/>

                <h4 style={{marginTop: '30px'}}>Preise - Erwachsene</h4>
                <label>Preis für Mitglieder (10er Karte)</label>
                <input name="price_10_card_members" type={"number"} value={info.price_10_card_members} onChange={handleChange} placeholder="150"/>
                <label>Preis für nicht Mitglieder (10er Karte)</label>
                <input name="price_10_card_nonMembers" type={"number"} value={info.price_10_card_nonMembers} onChange={handleChange} placeholder="150"/>

                <h4 style={{marginTop: '30px'}}> Preise - Kinder/Jugendliche</h4>
                <label>Preis für Mitglieder (10er Karte)</label>
                <input name="price_10_card_youth_members" type={"number"} value={info.price_10_card_youth_members} onChange={handleChange} placeholder="120"/>
                <label>Preis für nicht Mitglieder (10er Karte)</label>
                <input name="price_10_card_youth_nonMembers" type={"number"} value={info.price_10_card_youth_nonMembers} onChange={handleChange} placeholder="140"/>

                <button type="submit" className="submit-btn" style={{marginTop: '20px'}}>Einstellung speichern</button>
                {saveMessage && <p style={{color: 'green', marginTop: '10px'}}>{saveMessage}</p>}
            </form>
        </div>
    );
};