

## Dodajanje polja "What is Project all About?" (what_type tag)

### Kaj se spremeni

Novo dropdown polje z naslednjo specifikacijo:
- **Tag:** `["what_type", "<enum>"]`
- **Vrednosti:**
  - `IamAllowingMyself` = "I am Allowing Myself"
  - `EmbraceEnough` = "Embracing Enough"
  - `DigitalBeing` = "Digital Being"
  - `ProductOrService` = "Product Or Service"

### Datoteke za spremembo

**1. `src/lib/publishProject.ts` in `src/lib/updateProject.ts`**
- Dodaj `whatType` polje v `ProjectData` interface
- Dodaj `["what_type", projectData.whatType]` tag v tags array pri ustvarjanju/posodabljanju projekta

**2. `src/pages/CreateProject.tsx`**
- Dodaj `whatType: ""` v formData state
- Dodaj nov `<Select>` dropdown pod "Project Type" z label "What is Project all About? *"
- 4 opcije: I am Allowing Myself, Embracing Enough, Digital Being, Product Or Service
- Dodaj validacijo, da je polje obvezno

**3. `src/components/EditProjectDialog.tsx`**
- Dodaj `whatType` v formData state, preberi iz currentProject
- Dodaj enak `<Select>` dropdown kot v CreateProject
- Pri fetchanju svezih podatkov iz relayjev preberi `what_type` tag

**4. `src/hooks/useUserProjects.ts`**
- Dodaj `whatType?: string` v `NostrProject` interface
- Preberi `what_type` tag pri parsanju projekta

**5. `src/hooks/useAllProjects.ts`**
- Dodaj `whatType?: string` v `NostrProject` interface
- Preberi `what_type` tag pri parsanju projekta

### Tehnicni detajli

Enum mapping:
```text
Value (stored)          Label (displayed)
─────────────────────   ─────────────────────
IamAllowingMyself       I am Allowing Myself
EmbraceEnough           Embracing Enough
DigitalBeing            Digital Being
ProductOrService        Product Or Service
```

Nostr event tag primer:
```text
["what_type", "IamAllowingMyself"]
```

Dropdown bo postavljen takoj pod "Project Type" in pred "Project Status" v obeh formah (Create in Edit).

