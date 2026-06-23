# Luau Script Reconstructor

Petit outil web local pour Chrome/Desktop/Mobile qui aide a rendre des scripts `Lua/Luau` plus lisibles.

## Ce que fait l'outil

- import de fichiers `.lua`, `.luau` ou `.txt`
- affichage du source original
- reconstruction d'une mise en forme plus propre
- copie rapide du resultat
- telechargement du script reconstruit
- export JSON de tous les resultats

## Ce que l'outil ne fait pas

- aucune extraction depuis un jeu Roblox tiers
- aucune injection, aucun executor, aucun contournement de protections
- aucune recuperation de scripts serveur/client depuis Roblox

## Utilisation

1. Ouvre `index.html` dans Chrome.
2. Clique sur `Choisir des scripts`.
3. Selectionne tes propres fichiers `Lua/Luau`.
4. Lis le resultat dans `Resultat reconstruit`.
5. Utilise `Telecharger le script ouvert` ou `Telecharger tout en JSON`.

## Notes

Le moteur actuel est un reconstructeur/formatter simple. Il nettoie surtout :

- l'indentation
- les espaces
- certains blocs `if`, `else`, `elseif`, `function`, `do`, `repeat`, `until`, `end`

Si tu veux, la prochaine etape peut etre :

- ajout d'une coloration syntaxique
- analyse plus fine des fonctions/tables
- export `.zip`
- drag and drop mobile
