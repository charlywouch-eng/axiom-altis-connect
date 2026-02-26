

# Correction des bugs SignupLight - Email et Téléphone

## Probleme 1 : Le champ contact affiche le telephone par defaut au lieu de l'email

**Cause racine** : La condition ligne 365 de `SignupLight.tsx` est incorrecte :
```text
isPhone(form.contact) || (!form.contact && !form.contact.includes("@"))
```
Quand `form.contact` est vide, `!form.contact` vaut `true`, donc le PhoneInput s'affiche toujours par defaut avec "+237". L'utilisateur est bloque sur le mode telephone sans le vouloir.

**Solution** : Ajouter un etat `usePhone` explicite pour gerer le basculement entre email et telephone, au lieu de deviner le mode a partir de la valeur du champ.

### Modifications dans `src/pages/SignupLight.tsx`

1. Ajouter un etat `usePhone` initialise a `false` (email par defaut) :
   ```text
   const [usePhone, setUsePhone] = useState(false);
   ```

2. Remplacer la condition ligne 365 par :
   ```text
   {usePhone ? (
     <PhoneInput ... />
     <button onClick={() => { setUsePhone(false); handleChange("contact", ""); }}>
       Utiliser un email
     </button>
   ) : (
     <Input type="email" ... />
     <button onClick={() => { setUsePhone(true); handleChange("contact", "+237 "); }}>
       Utiliser un telephone
     </button>
   )}
   ```

3. Mettre a jour la validation `handleSubmit` pour utiliser `usePhone` au lieu de `isPhone(form.contact)` (ligne 142).

## Probleme 2 : Login "Invalid login credentials"

Ce n'est pas un bug de code. Le compte `charly@axiom-talent.com` n'existe pas encore en base avec un mot de passe. La connexion doit se faire via le bouton **"Continuer avec Google"** sur `/login`, ce qui creera automatiquement le compte. Aucune modification de code necessaire.

## Resume technique

| Fichier | Modification |
|---|---|
| `src/pages/SignupLight.tsx` | Ajout etat `usePhone`, correction condition affichage email/telephone, correction validation submit |

