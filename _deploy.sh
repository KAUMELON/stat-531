#!/bin/sh
# Rebuild the book and publish it.
# GitHub Pages serves the site from the docs/ folder of the main branch.
set -e

git pull origin main

Rscript _build.R

git add --all
git commit -m "Update the book"
git push origin main
