#!/bin/bash

# A simple script to automate git add, commit, and push.

echo "Status of the repository before committing:"
git status

echo "Adding all files..."
git add .

echo "Enter your commit message (or press enter for 'Update application'):"
read commit_message

if [ -z "$commit_message" ]; then
    commit_message="Update application"
fi

echo "Committing with message: '$commit_message'..."
git commit -m "$commit_message"

echo "Pushing configuration to origin..."
git push origin HEAD

echo "Deployment via Git script complete."
