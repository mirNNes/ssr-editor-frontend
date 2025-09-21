# Akronym – Reflektioner

### 1. Vad är din initiala upplevelse av dokument-orienterade databaser kontra relationsdatabaser?

Dokumentdatabaser känns enklare och mer naturliga i början, särskilt för snabba projekt och prototyper. En stor fördel är att man inte behöver skapa tabeller som i en relationsdatabas. Relationsdatabaser är relevanta när man vill bygga mer komplexa system och därför vill ha mer kontroll över datan.

---

### 2. Vilka lärdomar har du gjort kring refaktorering och vilka strategier tycker du fungerar bra?

Jag har lärt mig att refaktorering är bäst när man gör små förändringar i taget. Det är viktigt att testa koden ofta så att inget går sönder. Det är också viktigt att prata med kollegor och organisera arbetet så att vi slipper onödigt jobb.

I vårt fall, till exempel, var min kollega ägare av backend-repot och jag kunde inte koppla det till Azure Web App eftersom Azure Deployment Center använder GitHub’s API för att lista repor, och det visar endast repor vi själva äger direkt – inte repor vi är admin eller kollegor på.  
Så man tappade några timmar på att fixa allt detta, vilket förstås är en del av upplärningen.


---

### 3. Vilka fördelar och nackdelar ser du med JavaScript-ramverken för frontend?

Det är säkert till stor hjälp för en erfaren webbutvecklare som känner ämnet, eftersom man då snabbt kan bygga sidor med komponenter tack vare de många färdiga biblioteken som hjälper. Den som är varm i kläderna har inga problem att koppla till backend och API:er.

Vi som inte är varma i kläderna kan ha svårt att lära sig i början. Projektet kan bli rörigt om man inte organiserar koden; hur ska man länka allt, rätt URL till databasen, till Azure, och vad kopplar man var?

Små projekt behöver inte alltid ett ramverk, och det är svårt att förstå i sådana fall.

---

### 4. Vilka fördelar och nackdelar ser du med arbetssättet GitHub Flow nu efter att ni jobbat lite mer på riktigt?

**Fördelar:**
- Man jobbar alltid på egna brancher → main håller fungerande kod
- Lätt att samarbeta med andra, men en viss osäkerhet finns fortfarande; jag är osäker på om min kod kan påverka kollegans kod
- Man kan se alla ändringar som gjorts

**Nackdelar:**
- Kan kännas jobbigt för små ändringar
- Man måste komma ihåg att uppdatera brancher ofta
- Kan bli konflikt om flera ändrar samma fil samtidigt
>4
