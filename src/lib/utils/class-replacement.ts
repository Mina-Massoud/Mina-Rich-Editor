/**
 * Class Replacement Utilities
 * 
 * Smart logic for replacing Tailwind classes in the same category
 */

import { tailwindClasses } from "../tailwind-classes";

/**
 * Get the category of a Tailwind class
 * @param className - The class to categorize
 * @returns The category name or null if not found
 */
export function getClassCategory(className: string): string | null {
  for (const group of tailwindClasses) {
    if (group.classes.includes(className)) {
      return group.category;
    }
  }
  return null;
}

/**
 * Get all classes from a specific category
 * @param category - The category name
 * @returns Array of class names in that category
 */
export function getClassesInCategory(category: string): string[] {
  const group = tailwindClasses.find(g => g.category === category);
  return group ? group.classes : [];
}

/**
 * Check if two classes are in the same category
 * @param class1 - First class name
 * @param class2 - Second class name
 * @returns true if both classes are in the same category
 */
export function areSameCategory(class1: string, class2: string): boolean {
  const cat1 = getClassCategory(class1);
  const cat2 = getClassCategory(class2);
  return cat1 !== null && cat1 === cat2;
}

/**
 * Replace classes in the same category with a new class
 * @param currentClasses - Space-separated string of current classes
 * @param newClass - The new class to add
 * @returns Updated space-separated string of classes
 */
export function replaceClassInCategory(
  currentClasses: string,
  newClass: string
): string {
  if (!currentClasses) return newClass;

  const classes = currentClasses.split(' ').filter(Boolean);
  const newCategory = getClassCategory(newClass);

  if (!newCategory) {
    // If new class is not in our known categories, just add it
    return [...classes, newClass].join(' ');
  }

  const categoryClasses = getClassesInCategory(newCategory);
  
  // Remove all classes from the same category
  const filtered = classes.filter(cls => !categoryClasses.includes(cls));
  
  // Add the new class
  return [...filtered, newClass].join(' ');
}

/**
 * Get a summary of what will be replaced
 * @param currentClasses - Space-separated string of current classes
 * @param newClass - The new class to add
 * @returns Object with replacement info
 */
export function getReplacementInfo(
  currentClasses: string,
  newClass: string
): {
  willReplace: boolean;
  replacedClasses: string[];
  newClasses: string;
  category: string | null;
} {
  const classes = currentClasses.split(' ').filter(Boolean);
  const newCategory = getClassCategory(newClass);

  if (!newCategory) {
    return {
      willReplace: false,
      replacedClasses: [],
      newClasses: replaceClassInCategory(currentClasses, newClass),
      category: null,
    };
  }

  const categoryClasses = getClassesInCategory(newCategory);
  const replacedClasses = classes.filter(cls => categoryClasses.includes(cls));

  return {
    willReplace: replacedClasses.length > 0,
    replacedClasses,
    newClasses: replaceClassInCategory(currentClasses, newClass),
    category: newCategory,
  };
}

/**
 * Get current classes from a selection's className attribute
 * @param className - The className string (might be null/undefined)
 * @returns Array of class names
 */
export function getCurrentClasses(className: string | null | undefined): string[] {
  if (!className) return [];
  return className.split(' ').filter(Boolean);
}

/**
 * Merge new class with existing classes, replacing same-category classes
 * @param existingClassName - Current className string
 * @param newClass - New class to apply
 * @returns Updated className string
 */
export function mergeClasses(
  existingClassName: string | null | undefined,
  newClass: string
): string {
  const current = existingClassName || '';
  return replaceClassInCategory(current, newClass);
}

