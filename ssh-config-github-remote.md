# Configurar un remoto con SSH en GitHub

Cuando trabajas con GitHub, puedes usar SSH en vez de HTTPS para evitar escribir usuario/contraseña cada vez.

---

## 1. Formato del remoto SSH

El formato es:

```bash
git@github.com:USUARIO/REPO.git
```

Por ejemplo, para tu repo:

```bash
git@github.com:omarigg04/jardinero.git
```

---

## 2. Agregar el remoto SSH

Si el repo **aún no tiene remoto**:

```bash
git remote add origin git@github.com:omarigg04/jardinero.git
```

---

## 3. Cambiar un remoto de HTTPS a SSH

Si ya está configurado con HTTPS y lo quieres cambiar a SSH:

```bash
git remote set-url origin git@github.com:omarigg04/jardinero.git
```

---

## 4. Verificar el remoto actual

Para ver qué URL usa tu repo:

```bash
git remote -v
```

Debe mostrar algo como:

```
origin  git@github.com:omarigg04/jardinero.git (fetch)
origin  git@github.com:omarigg04/jardinero.git (push)
```

---

## 5. Primer push con SSH

Si es la primera vez que subes el repo:

```bash
git push -u origin main
```

Luego ya podrás usar simplemente:

```bash
git push
```

---

## Resumen rápido

* **Nuevo remoto:** `git remote add origin git@github.com:usuario/repo.git`
* **Cambiar remoto:** `git remote set-url origin git@github.com:usuario/repo.git`
* **Ver remoto:** `git remote -v`
