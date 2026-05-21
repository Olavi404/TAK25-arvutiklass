# Andmebaasi loogiline disain

## Tabelite valik ja põhjendus

Süsteem koosneb neljast tabelist, mis katavad kõik põhivajadused:

- **classroom** – arvutiklass kui füüsiline ressurss (nimi, maht, asukoht, varustus)
- **user_or_group** – broneeringu tegija: õpetaja, õpilasgrupp või väline kasutaja
- **lesson_type** – lookup-tabel tunni tüübi jaoks (loeng, praktikum, eksam jne), et vältida vabu tekstvälju
- **booking** – peamine tehingutabel, mis seob klassi, kasutaja/grupi ja tüübi konkreetse aja ja kuupäevaga

## N..M seoste lahendamine

Käesolevas mudelis ei esine otsest N..M seost – `booking` toimib ise vahetabelina:
- Üks klass võib omada mitu broneeringut (`classroom` 1 → N `booking`)
- Üks kasutaja/grupp võib teha mitu broneeringut (`user_or_group` 1 → N `booking`)
- Üks tunni tüüp võib esineda mitmes broneeringus (`lesson_type` 1 → N `booking`)

Kui tulevikus peaks lisanduma mitme klassiga üheaegne broneering (nt "varuklassi" loogika), lahendataks see vahetabeliga `booking_classroom(booking_id, classroom_id)`.

## Ärireeglid

| Reegel | Rakenduskoht |
|--------|-------------|
| `end_time > start_time` – lõpuaeg peab olema pärast algusaega | `CHECK` piirang tabelis `booking` |
| `participant_count >= 0` – osalejate arv ei saa olla negatiivne | `CHECK` piirang tabelis `booking` |
| `capacity > 0` – klassiruumi maht peab olema positiivne | `CHECK` piirang tabelis `classroom` |
| Sama klass ei saa olla samal ajal kaks korda broneeritud | rakenduse tasemel (INSERT eel kontroll) või trigger |

## Normaliseerimine

Andmebaas vastab **3. normaalkujule (3NF)**:
- 1NF: kõik väärtused on aatomilised, korduvrühmi ei ole
- 2NF: kõik mittevõtme atribuudid sõltuvad täielikult primaarvõtmest
- 3NF: ei esine transitiivseid sõltuvusi (nt `department` on seotud `user_or_group`-ga, mitte `booking`-uga)
