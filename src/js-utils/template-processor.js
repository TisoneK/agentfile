/**
 * Template Processor Module
 * 
 * Processes template files with variable substitution and conditional blocks
 * 
 * @module template-processor
 */

/**
 * Find matching {{/each}} for an {{#each}} block at given position
 * Handles nested each blocks properly using a stack-based approach
 * @param {string} template - Template string
 * @param {number} startPos - Position to start searching from (after {{#each ...}})
 * @returns {Object} { endPos } or null if not found
 */
function findMatchingEndEach(template, startPos) {
  // Find all {{#each ...}} and {{/each}} tags and match them using a stack
  const eachOpenPattern = /\{\{#each\s+[^}]+\}\}/g;
  const eachClosePattern = /\{\{\/each\}\}/g;
  
  // Reset regex states
  eachOpenPattern.lastIndex = 0;
  eachClosePattern.lastIndex = 0;
  
  const tags = [];
  let match;
  
  // Find all {{#each ...}} tags
  while ((match = eachOpenPattern.exec(template)) !== null) {
    if (match.index >= startPos) {
      tags.push({ type: 'open', pos: match.index });
    }
  }
  
  // Find all {{/each}} tags
  while ((match = eachClosePattern.exec(template)) !== null) {
    if (match.index >= startPos) {
      tags.push({ type: 'close', pos: match.index, len: match[0].length });
    }
  }
  
  // Sort by position
  tags.sort((a, b) => a.pos - b.pos);
  
  // Use stack to find matching close
  let depth = 1;
  for (let i = 0; i < tags.length; i++) {
    if (tags[i].type === 'open') {
      depth++;
    } else if (tags[i].type === 'close') {
      depth--;
      if (depth === 0) {
        return { endPos: tags[i].pos + tags[i].len };
      }
    }
  }
  
  return null;
}

/**
 * Process all iteration blocks in a template recursively
 * @param {string} template - Template string with {{#each}} / {{/each}} blocks
 * @param {Object} context - Object with iteration data
 * @param {string} partialsDir - Optional directory containing partial files
 * @returns {Object} Result with success/error and processed template
 */
function processIterations(template, context, partialsDir) {
  // Check for unclosed each blocks first - count {{#each}} and {{/each}}
  const eachCount = (template.match(/\{\{#each\s/g) || []).length;
  const endeachCount = (template.match(/\{\{\/each\}\}/g) || []).length;
  
  // Check for unmatched {{/each}} (more endeach than each)
  if (endeachCount > eachCount) {
    return {
      success: false,
      error: {
        code: 'ERR_TEMPLATE_MISSING_END_EACH',
        message: 'Extra {{/each}} without matching {{#each}}',
        details: { operation: 'processIterations' }
      }
    };
  }
  
  // Base case: no more iterations
  if (!template.includes('{{#each')) {
    // Check for unclosed each blocks
    if (eachCount > endeachCount && template.includes('{{#each')) {
      return {
        success: false,
        error: {
          code: 'ERR_TEMPLATE_UNCLOSED_EACH',
          message: 'Unclosed {{#each}} block - missing {{/each}}',
          details: { operation: 'processIterations' }
        }
      };
    }
    return { success: true, result: template };
  }
  
  // Find the first {{#each}}
  const eachMatch = template.match(/\{\{#each\s+([^}]+)\}\}/);
  if (!eachMatch) {
    // Check if there's an unmatched {{/each}}
    if (template.includes('{{/each}}')) {
      return {
        success: false,
        error: {
          code: 'ERR_TEMPLATE_MISSING_END_EACH',
          message: 'Extra {{/each}} without matching {{#each}}',
          details: { operation: 'processIterations' }
        }
      };
    }
    return { success: true, result: template };
  }
  
  const collectionName = eachMatch[1].trim();
  const eachStart = eachMatch.index;
  const eachTagLength = eachMatch[0].length;
  
  // Find matching {{/each}}
  const endeachResult = findMatchingEndEach(template, eachStart + eachTagLength);
  
  if (!endeachResult) {
    return {
      success: false,
      error: {
        code: 'ERR_TEMPLATE_UNCLOSED_EACH',
        message: 'Unclosed {{#each ' + collectionName + '}} - missing {{/each}}',
        details: { operation: 'processIterations', collection: collectionName }
      }
    };
  }
  
  // Extract content inside the iteration block
  const contentStart = eachStart + eachTagLength;
  const contentEnd = endeachResult.endPos - 9; // -9 to exclude {{/each}} (9 chars)
  const innerContent = template.substring(contentStart, contentEnd);
  
  // Get the collection from context
  let collection = context[collectionName];
  
  // Check if collection is valid
  if (collection === undefined || collection === null) {
    // Treat undefined/null collection as empty - remove the block
    const fullBlock = template.substring(eachStart, endeachResult.endPos);
    let newTemplate = template.replace(fullBlock, '');
    return processIterations(newTemplate, context);
  }
  
  // Check if collection is an array
  if (!Array.isArray(collection)) {
    return {
      success: false,
      error: {
        code: 'ERR_TEMPLATE_INVALID_ITERABLE',
        message: 'Collection "' + collectionName + '" must be an array for iteration',
        details: { operation: 'processIterations', collection: collectionName, receivedType: typeof collection }
      }
    };
  }
  
  // Process each item in the collection
  let processedItems = [];
  
  for (let i = 0; i < collection.length; i++) {
    const item = collection[i];
    
    // Create item context with {{this}} reference
    const itemContext = {
      ...context,
      this: item,
      index: i
    };
    
    // Add item properties to context for direct access
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach(key => {
        itemContext[key] = item[key];
      });
    }
    
    // Process inner content with item context
    let processedContent = innerContent;
    
    // First process any nested conditionals
    if (processedContent.includes('{{#if') || processedContent.includes('{{/if}}')) {
      const conditionalResult = processConditionals(processedContent, itemContext);
      if (!conditionalResult.success) {
        return conditionalResult;
      }
      processedContent = conditionalResult.result;
    }
    
    // Then process nested iterations
    if (processedContent.includes('{{#each')) {
      const iterationResult = processIterations(processedContent, itemContext, partialsDir);
      if (!iterationResult.success) {
        return iterationResult;
      }
      processedContent = iterationResult.result;
    }
    
    // Then process partials (if partialsDir is provided)
    if (partialsDir && processedContent.includes('{{>')) {
      const partialResult = processPartials(processedContent, itemContext, partialsDir);
      if (!partialResult.success) {
        return partialResult;
      }
      processedContent = partialResult.result;
    }
    
    // Then substitute variables
    const variablePattern = /\{\{\s*([^}]+?)\s*\}\}/g;
    processedContent = processedContent.replace(variablePattern, (match, varName) => {
      // Skip conditional and iteration tags
      const trimmedName = varName.trim();
      if (trimmedName.startsWith('#if') || trimmedName.startsWith('/if') || 
          trimmedName.startsWith('#each') || trimmedName.startsWith('/each')) {
        return '';
      }
      
      // Handle dot notation for property access (e.g., this.name)
      let value;
      if (trimmedName.includes('.')) {
        const parts = trimmedName.split('.');
        value = itemContext;
        for (const part of parts) {
          if (value && typeof value === 'object' && part in value) {
            value = value[part];
          } else {
            value = undefined;
            break;
          }
        }
      } else {
        value = itemContext[trimmedName];
      }
      
      return value !== undefined ? value : '';
    });
    
    processedItems.push(processedContent);
  }
  
  // Join all processed items
  const resultContent = processedItems.join('');
  
  // Replace the entire block with result
  const fullBlock = template.substring(eachStart, endeachResult.endPos);
  let newTemplate = template.replace(fullBlock, resultContent);
  
  // Recursively process remaining iterations
  return processIterations(newTemplate, context, partialsDir);
}

/**
 * Evaluate a condition value for truthiness/falsiness
 * Also handles dot notation like 'this.property' or 'property'
 * @param {*} value - Value to evaluate
 * @param {Object} context - Context object for resolving dot notation
 * @param {string} conditionName - Original condition name (may contain dot notation)
 * @returns {boolean} True if truthy, false if falsy
 */
function evaluateCondition(value, context, conditionName) {
  // If value is undefined and conditionName contains dot notation, try to resolve it
  if (conditionName && conditionName.includes('.')) {
    const parts = conditionName.split('.');
    let resolved = context;
    for (const part of parts) {
      if (resolved && typeof resolved === 'object' && part in resolved) {
        resolved = resolved[part];
      } else {
        resolved = undefined;
        break;
      }
    }
    value = resolved;
  }
  
  // Truthy: non-empty strings, numbers != 0, true, arrays with items
  // Falsy: empty strings, 0, false, null, undefined, empty arrays
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return value !== '';
  if (Array.isArray(value)) return value.length > 0;
  return !!value;
}

/**
 * Find matching {{/if}} for an {{#if}} block at given position
 * Handles nested conditionals properly using a stack-based approach
 * @param {string} template - Template string
 * @param {number} startPos - Position to start searching from (after {{#if ...}})
 * @returns {Object} { endPos } or null if not found
 */
function findMatchingEndif(template, startPos) {
  const ifPattern = /\{\{#if\s+[^}]+\}\}/g;
  const endifPattern = /\{\{\/if\}\}/g;
  
  // Reset regex states
  ifPattern.lastIndex = 0;
  endifPattern.lastIndex = 0;
  
  // Find all tag positions
  const tags = [];
  
  // Find all {{#if ...}}
  let match;
  while ((match = ifPattern.exec(template)) !== null) {
    if (match.index >= startPos) {
      tags.push({ type: 'if', pos: match.index, text: match[0] });
    }
  }
  
  // Find all {{/if}}
  while ((match = endifPattern.exec(template)) !== null) {
    if (match.index >= startPos) {
      tags.push({ type: 'endif', pos: match.index, text: match[0] });
    }
  }
  
  // Sort by position
  tags.sort((a, b) => a.pos - b.pos);
  
  // Use stack to find matching endif
  let depth = 1;
  for (let i = 0; i < tags.length; i++) {
    if (tags[i].type === 'if') {
      depth++;
    } else if (tags[i].type === 'endif') {
      depth--;
      if (depth === 0) {
        return { endPos: tags[i].pos + tags[i].text.length };
      }
    }
  }
  
  return null;
}

/**
 * Process all conditional blocks in a template recursively
 * @param {string} template - Template string with {{#if}} / {{/if}} blocks
 * @param {Object} context - Object with condition values
 * @returns {Object} Result with success/error and processed template
 */
function processConditionals(template, context) {
  // Check for unclosed if blocks first - count {{#if}} and {{/if}}
  const ifCount = (template.match(/\{\{#if\s/g) || []).length;
  const endifCount = (template.match(/\{\{\/if\}\}/g) || []).length;
  
  // Check for unmatched {{/if}} (more endif than if)
  if (endifCount > ifCount) {
    return {
      success: false,
      error: {
        code: 'ERR_TEMPLATE_MISSING_ENDIF',
        message: 'Extra {{/if}} without matching {{#if}}',
        details: { operation: 'processConditionals' }
      }
    };
  }
  
  // Base case: no more conditionals
  if (!template.includes('{{#if')) {
    // Check for unclosed if blocks
    if (ifCount > endifCount && template.includes('{{#if')) {
      return {
        success: false,
        error: {
          code: 'ERR_TEMPLATE_UNCLOSED_IF',
          message: 'Unclosed {{#if}} block - missing {{/if}}',
          details: { operation: 'processConditionals' }
        }
      };
    }
    return { success: true, result: template };
  }
  
  // Find the first {{#if}}
  const ifMatch = template.match(/\{\{#if\s+([^}]+)\}\}/);
  if (!ifMatch) {
    // Check if there's an unmatched {{/if}}
    if (template.includes('{{/if}}')) {
      return {
        success: false,
        error: {
          code: 'ERR_TEMPLATE_MISSING_ENDIF',
          message: 'Extra {{/if}} without matching {{#if}}',
          details: { operation: 'processConditionals' }
        }
      };
    }
    return { success: true, result: template };
  }
  
  const conditionName = ifMatch[1].trim();
  const ifStart = ifMatch.index;
  const ifTagLength = ifMatch[0].length;
  
  // Find matching {{/if}}
  const endifResult = findMatchingEndif(template, ifStart + ifTagLength);
  
  if (!endifResult) {
    return {
      success: false,
      error: {
        code: 'ERR_TEMPLATE_UNCLOSED_IF',
        message: 'Unclosed {{#if ' + conditionName + '}} - missing {{/if}}',
        details: { operation: 'processConditionals', condition: conditionName }
      }
    };
  }
  
  // Extract content inside the conditional block
  const contentStart = ifStart + ifTagLength;
  const contentEnd = endifResult.endPos - 7; // -7 to exclude {{/if}}
  const innerContent = template.substring(contentStart, contentEnd);
  
  // Get the condition value
  const conditionValue = evaluateCondition(context[conditionName], context, conditionName);
  
  let newTemplate;
  if (conditionValue) {
    // Process inner content recursively (might have more conditionals)
    let processedContent;
    if (innerContent.includes('{{#if')) {
      const innerResult = processConditionals(innerContent, context);
      if (!innerResult.success) {
        return innerResult;
      }
      processedContent = innerResult.result;
    } else {
      processedContent = innerContent;
    }
    
    // Replace the entire block with processed content
    const fullBlock = template.substring(ifStart, endifResult.endPos);
    newTemplate = template.replace(fullBlock, processedContent);
  } else {
    // Remove the entire block
    const fullBlock = template.substring(ifStart, endifResult.endPos);
    newTemplate = template.replace(fullBlock, '');
  }
  
  // Recursively process remaining conditionals
  return processConditionals(newTemplate, context);
}

/**
 * Process a template string with variable substitution
 * @param {string} template - Template string with {{variable}} placeholders
 * @param {Object} context - Object with variable values
 * @param {Object} options - Optional configuration options
 * @param {string} options.partialsDir - Directory containing partial templates
 * @returns {Object} Result with success/error and processed template
 */
function processTemplate(template, context, options = {}) {
  const partialsDir = options.partialsDir;
  // Validate template is a string
  if (typeof template !== 'string') {
    return {
      success: false,
      error: {
        code: 'ERR_TEMPLATE_INVALID_INPUT',
        message: 'Template must be a string',
        details: { operation: 'processTemplate', receivedType: typeof template }
      }
    };
  }

  // Validate context is an object
  if (typeof context !== 'object' || context === null) {
    return {
      success: false,
      error: {
        code: 'ERR_TEMPLATE_INVALID_INPUT',
        message: 'Context must be an object',
        details: { operation: 'processTemplate', receivedType: typeof context }
      }
    };
  }

  try {
    // Step 1: Process conditional blocks first
    let processedResult = template;
    
    // Check if template has conditional blocks
    if (template.includes('{{#if') || template.includes('{{/if}}')) {
      const conditionalResult = processConditionals(template, context);
      if (!conditionalResult.success) {
        return conditionalResult;
      }
      processedResult = conditionalResult.result;
    }
    
    // Step 2: Then process iteration blocks
    // Must process if either {{#each or {{/each}} is present
    if (processedResult.includes('{{#each') || processedResult.includes('{{/each}}')) {
      const iterationResult = processIterations(processedResult, context, partialsDir);
      if (!iterationResult.success) {
        return iterationResult;
      }
      processedResult = iterationResult.result;
    }
    
    // Step 3: Then process partial templates (if partialsDir is provided)
    if (partialsDir && processedResult.includes('{{>')) {
      const partialResult = processPartials(processedResult, context, partialsDir);
      if (!partialResult.success) {
        return partialResult;
      }
      processedResult = partialResult.result;
    }
    
    // Step 4: Then process variable substitutions
    // Regex to match {{variable}} pattern
    // Matches: {{variableName}} with optional whitespace inside braces
    const variablePattern = /\{\{\s*([^}]+?)\s*\}\}/g;

    // Replace all placeholders with values from context
    const result = processedResult.replace(variablePattern, (match, varName) => {
      // Skip conditional and iteration tags - return empty to remove them
      const trimmedName = varName.trim();
      if (trimmedName.startsWith('#if') || trimmedName.startsWith('/if') || 
          trimmedName.startsWith('#each') || trimmedName.startsWith('/each')) {
        return '';
      }
      
      // Handle dot notation for property access (e.g., this.name)
      let value;
      if (trimmedName.includes('.')) {
        const parts = trimmedName.split('.');
        value = context;
        for (const part of parts) {
          if (value && typeof value === 'object' && part in value) {
            value = value[part];
          } else {
            value = undefined;
            break;
          }
        }
      } else {
        value = context[trimmedName];
      }
      
      // Return value if defined, otherwise return empty string
      return value !== undefined ? value : '';
    });

    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'ERR_TEMPLATE_PROCESS_FAILED',
        message: 'Template processing failed: ' + error.message,
        details: { operation: 'processTemplate', originalError: error.message }
      }
    };
  }
}

/**
 * Load a partial file from the partials directory
 * @param {string} partialName - Name of the partial to load
 * @param {string} partialsDir - Directory containing partial files
 * @returns {Object} Result with success/error and partial content
 */
function loadPartial(partialName, partialsDir) {
  const fs = require('fs');
  const path = require('path');

  // Try different extensions
  const extensions = ['', '.html', '.md', '.txt'];
  
  for (const ext of extensions) {
    const partialPath = path.join(partialsDir, partialName + ext);
    try {
      if (fs.existsSync(partialPath)) {
        const content = fs.readFileSync(partialPath, 'utf-8');
        return { success: true, content };
      }
    } catch (error) {
      // Continue to try next extension
    }
  }
  
  return {
    success: false,
    error: {
      code: 'ERR_TEMPLATE_PARTIAL_NOT_FOUND',
      message: 'Partial "' + partialName + '" not found in "' + partialsDir + '"',
      details: { operation: 'loadPartial', partialName, partialsDir }
    }
  };
}

/**
 * Process all partial templates in a template string
 * @param {string} template - Template string with {{> partialName}} includes
 * @param {Object} context - Object with variable values
 * @param {string} partialsDir - Directory containing partial files
 * @param {number} depth - Current nesting depth
 * @param {Set} resolvingPartials - Set of currently resolving partials for circular detection
 * @returns {Object} Result with success/error and processed template
 */
function processPartials(template, context, partialsDir, depth = 0, resolvingPartials = null) {
  // Initialize resolvingPartials on first call
  if (resolvingPartials === null) {
    resolvingPartials = new Set();
  }

  // Check maximum depth to prevent infinite loops
  const MAX_DEPTH = 10;
  if (depth > MAX_DEPTH) {
    return {
      success: false,
      error: {
        code: 'ERR_TEMPLATE_PARTIAL_DEPTH_EXCEEDED',
        message: 'Maximum partial nesting depth (' + MAX_DEPTH + ') exceeded',
        details: { operation: 'processPartials', depth }
      }
    };
  }

  // Base case: no more partials
  if (!template.includes('{{>')) {
    return { success: true, result: template };
  }

  // Match partial include pattern: {{> partialName}}
  const partialPattern = /\{\{>\s*([^}]+)\}\}/g;
  
  // Find all partial matches
  let match;
  const matches = [];
  while ((match = partialPattern.exec(template)) !== null) {
    matches.push({
      fullMatch: match[0],
      partialName: match[1].trim(),
      index: match.index
    });
  }

  // If no matches, return as is
  if (matches.length === 0) {
    return { success: true, result: template };
  }

  // Process each partial from end to beginning (to preserve indices)
  let result = template;
  
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    const partialName = m.partialName;
    
    // Check for circular reference
    if (resolvingPartials.has(partialName)) {
      return {
        success: false,
        error: {
          code: 'ERR_TEMPLATE_PARTIAL_CIRCULAR',
          message: 'Circular partial reference detected: ' + partialName,
          details: { operation: 'processPartials', partialName }
        }
      };
    }
    
    // Add to resolving set
    resolvingPartials.add(partialName);
    
    // Load the partial
    const partialResult = loadPartial(partialName, partialsDir);
    
    if (!partialResult.success) {
      resolvingPartials.delete(partialName);
      return partialResult;
    }
    
    // Process the partial content recursively with same context (for nested partials)
    let partialContent = partialResult.content;
    
    // Check if partial content has more partials
    if (partialContent.includes('{{>')) {
      const nestedResult = processPartials(partialContent, context, partialsDir, depth + 1, resolvingPartials);
      if (!nestedResult.success) {
        resolvingPartials.delete(partialName);
        return nestedResult;
      }
      partialContent = nestedResult.result;
    }
    
    // Process variables in partial content with parent context
    const variablePattern = /\{\{\s*([^}]+?)\s*\}\}/g;
    partialContent = partialContent.replace(variablePattern, (match, varName) => {
      // Skip conditional and iteration tags
      const trimmedName = varName.trim();
      if (trimmedName.startsWith('#if') || trimmedName.startsWith('/if') || 
          trimmedName.startsWith('#each') || trimmedName.startsWith('/each')) {
        return '';
      }
      
      // Handle dot notation
      let value;
      if (trimmedName.includes('.')) {
        const parts = trimmedName.split('.');
        value = context;
        for (const part of parts) {
          if (value && typeof value === 'object' && part in value) {
            value = value[part];
          } else {
            value = undefined;
            break;
          }
        }
      } else {
        value = context[trimmedName];
      }
      
      return value !== undefined ? value : '';
    });
    
    // Replace the partial tag with content
    result = result.substring(0, m.index) + partialContent + result.substring(m.index + m.fullMatch.length);
    
    // Remove from resolving set
    resolvingPartials.delete(partialName);
  }

  // Check if there are more partials to process (in case new ones were added)
  if (result.includes('{{>')) {
    return processPartials(result, context, partialsDir, depth, resolvingPartials);
  }

  return { success: true, result };
}

/**
 * Get line and column info for a position in the template
 * @param {string} template - Template string
 * @param {number} position - Character position
 * @returns {Object} { line, column }
 */
function getLineInfo(template, position) {
  const text = template.substring(0, position);
  const lines = text.split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}

/**
 * Validate variable syntax - {{variableName}}
 * @param {string} template - Template string
 * @returns {Array} Array of validation errors
 */
function validateVariables(template) {
  const errors = [];
  // Match {{variable}} but not {{#if}}, {{#each}}, {{/if}}, {{/each}}, {{> partial}}
  // Must start with a letter, number, underscore, or dot (for this.name)
  const varPattern = /\{\{([a-zA-Z0-9_.][^}]*)\}\}/g;
  
  let match;
  while ((match = varPattern.exec(template)) !== null) {
    const content = match[1].trim();
    const lineInfo = getLineInfo(template, match.index);
    
    // Skip recognized block tags that might match this pattern
    if (content.startsWith('#if') || content.startsWith('#each') || 
        content.startsWith('/if') || content.startsWith('/each') ||
        content.startsWith('>')) {
      continue;
    }
    
    // Check for empty braces
    if (content === '') {
      errors.push({
        line: lineInfo.line,
        column: lineInfo.column,
        type: 'INVALID_VARIABLE',
        message: 'Empty variable syntax {{}}',
        snippet: '{{}}'
      });
      continue;
    }
    
    // Check for nested braces (invalid)
    if (content.includes('{{') || content.includes('}}')) {
      errors.push({
        line: lineInfo.line,
        column: lineInfo.column,
        type: 'INVALID_SYNTAX',
        message: 'Nested braces detected in variable',
        snippet: match[0]
      });
    }
  }
  
  return errors;
}

/**
 * Validate conditional block tags ({{#if}} and {{/if}})
 * @param {string} template - Template string
 * @returns {Array} Array of validation errors
 */
function validateConditionalBlocks(template) {
  const errors = [];
  const stack = []; // Track opening tags with line info
  
  // Match {{#if condition}} and {{/if}}
  const blockPattern = /\{\{(#if|#each|\/if|\/each)\s*([^}]*)\}\}/g;
  
  let match;
  while ((match = blockPattern.exec(template)) !== null) {
    const tag = match[1];
    const content = match[2];
    const lineInfo = getLineInfo(template, match.index);
    
    if (tag.startsWith('/')) {
      // Closing tag
      if (tag === '/if') {
        if (stack.length === 0 || stack[stack.length - 1].type !== '#if') {
          errors.push({
            line: lineInfo.line,
            column: lineInfo.column,
            type: 'UNOPENED_TAG',
            message: 'Closing {{/if}} without matching {{#if}}',
            tag: '{{/if}}'
          });
        } else {
          stack.pop(); // Pop matching #if
        }
      } else if (tag === '/each') {
        if (stack.length === 0 || stack[stack.length - 1].type !== '#each') {
          errors.push({
            line: lineInfo.line,
            column: lineInfo.column,
            type: 'UNOPENED_TAG',
            message: 'Closing {{/each}} without matching {{#each}}',
            tag: '{{/each}}'
          });
        } else {
          stack.pop(); // Pop matching #each
        }
      }
    } else {
      // Opening tag
      if (tag === '#if') {
        if (!content || content.trim() === '') {
          errors.push({
            line: lineInfo.line,
            column: lineInfo.column,
            type: 'INVALID_SYNTAX',
            message: 'Empty {{#if}} condition',
            tag: '{{#if}}'
          });
        }
        stack.push({ type: '#if', line: lineInfo.line });
      } else if (tag === '#each') {
        if (!content || content.trim() === '') {
          errors.push({
            line: lineInfo.line,
            column: lineInfo.column,
            type: 'INVALID_SYNTAX',
            message: 'Empty {{#each}} collection',
            tag: '{{#each}}'
          });
        }
        stack.push({ type: '#each', line: lineInfo.line });
      }
    }
  }
  
  // Check for unclosed tags
  while (stack.length > 0) {
    const unclosed = stack.pop();
    errors.push({
      line: unclosed.line,
      column: 1,
      type: 'UNCLOSED_TAG',
      message: 'Unclosed {{' + unclosed.type + '}} block - missing {{/' + unclosed.type.substring(1) + '}}',
      tag: '{{' + unclosed.type + '}}'
    });
  }
  
  return errors;
}

/**
 * Validate partial include syntax ({{> partialName}})
 * @param {string} template - Template string
 * @returns {Array} Array of validation errors
 */
function validatePartialIncludes(template) {
  const errors = [];
  
  // Match {{> partialName}} - note: > must be followed by whitespace or partial name
  const partialPattern = /\{\{>\s*([^}]*)\s*\}\}/g;
  
  let match;
  while ((match = partialPattern.exec(template)) !== null) {
    const partialName = match[1].trim();
    const lineInfo = getLineInfo(template, match.index);
    
    // Check for empty partial name (just {{>}})
    if (match[0] === '{{>}}') {
      errors.push({
        line: lineInfo.line,
        column: lineInfo.column,
        type: 'INVALID_SYNTAX',
        message: 'Empty partial name {{>}}',
        snippet: '{{>}}'
      });
      continue;
    }
    
    // Check for empty partial name after trimming
    if (!partialName || partialName === '') {
      errors.push({
        line: lineInfo.line,
        column: lineInfo.column,
        type: 'INVALID_SYNTAX',
        message: 'Empty partial name {{>}}',
        snippet: match[0]
      });
      continue;
    }
    
    // Check for invalid partial name characters
    // Allow alphanumerics, underscore, hyphen, dot (for nested paths)
    if (!/^[a-zA-Z0-9_./\-]+$/.test(partialName)) {
      errors.push({
        line: lineInfo.line,
        column: lineInfo.column,
        type: 'INVALID_SYNTAX',
        message: 'Invalid partial name: "' + partialName + '"',
        snippet: match[0]
      });
    }
  }
  
  return errors;
}

/**
 * Validate general syntax - detect any {{}} patterns that aren't valid
 * @param {string} template - Template string
 * @returns {Array} Array of validation errors
 */
function validateGeneralSyntax(template) {
  const errors = [];
  
  // Match any {{...}} pattern (including empty {{}})
  const anyBracePattern = /\{\{([^}]*)\}\}/g;
  
  let match;
  while ((match = anyBracePattern.exec(template)) !== null) {
    const content = match[1];
    const lineInfo = getLineInfo(template, match.index);
    
    const trimmed = content.trim();
    
    // Check for recognized patterns (all should be caught by specific validators)
    const isVariable = /^[a-zA-Z0-9_.]/.test(trimmed); // {{variable}} - starts with valid char
    const isIfOpen = /^#if\s+/.test(trimmed);          // {{#if condition}}
    const isIfClose = /^\/if\s*$/.test(trimmed);     // {{/if}}
    const isEachOpen = /^#each\s+/.test(trimmed);      // {{#each collection}}
    const isEachClose = /^\/each\s*$/.test(trimmed);   // {{/each}}
    const isPartial = /^>\s+/.test(trimmed);             // {{> partialName}}
    
    // Check for empty braces {{}} - this is always an error
    if (trimmed === '') {
      errors.push({
        line: lineInfo.line,
        column: lineInfo.column,
        type: 'INVALID_VARIABLE',
        message: 'Empty variable syntax {{}}',
        snippet: '{{}}'
      });
      continue;
    }
    
    // If none of the recognized patterns, it's invalid syntax
    if (!isVariable && !isIfOpen && !isIfClose && !isEachOpen && !isEachClose && !isPartial) {
      // Check if it looks like a block tag but is malformed
      if (trimmed.startsWith('#') || trimmed.startsWith('/')) {
        errors.push({
          line: lineInfo.line,
          column: lineInfo.column,
          type: 'INVALID_SYNTAX',
          message: 'Unrecognized template tag: {{' + trimmed + '}}',
          snippet: match[0]
        });
      }
      // Check for nested braces like {{ {{nested}} }}
      else if (trimmed.includes('{{') || trimmed.includes('}}')) {
        errors.push({
          line: lineInfo.line,
          column: lineInfo.column,
          type: 'INVALID_SYNTAX',
          message: 'Nested braces detected in variable',
          snippet: match[0]
        });
      }
    }
  }
  
  return errors;
}

/**
 * Validate nested structures for proper matching
 * @param {string} template - Template string
 * @returns {Array} Array of validation errors
 */
function validateNestedStructures(template) {
  const errors = [];
  const stack = [];
  
  // Match all block tags with their full content
  const blockPattern = /\{\{(#if|#each)\s+([^}]+)\}\}/g;
  const closePattern = /\{\{(\/if|\/each)\}\}/g;
  
  // Find all opening tags with positions
  const tags = [];
  let match;
  
  // Find all #if
  while ((match = blockPattern.exec(template)) !== null) {
    tags.push({
      type: match[1],
      content: match[2],
      pos: match.index,
      open: true,
      line: getLineInfo(template, match.index).line
    });
  }
  
  // Reset regex
  blockPattern.lastIndex = 0;
  
  // Find all closing tags
  while ((match = closePattern.exec(template)) !== null) {
    tags.push({
      type: match[1].replace('/', '#'), // Convert /if to #if for comparison
      content: '',
      pos: match.index,
      open: false,
      line: getLineInfo(template, match.index).line
    });
  }
  
  // Sort by position
  tags.sort((a, b) => a.pos - b.pos);
  
  // Validate proper nesting
  for (const tag of tags) {
    if (tag.open) {
      stack.push(tag);
    } else {
      if (stack.length === 0) {
        // Should have been caught by validateConditionalBlocks
        continue;
      }
      
      const top = stack[stack.length - 1];
      
      // Check for mismatched tags (e.g., {{#if}}...{{/each}})
      if (top.type !== tag.type) {
        errors.push({
          line: tag.line,
          column: 1,
          type: 'MISMATCHED_TAGS',
          message: 'Mismatched tags: expected {{/' + top.type.substring(1) + '}}, found {{/' + tag.type.substring(1) + '}}',
          tag: '{{' + tag.type.replace('#', '/') + '}}'
        });
      } else {
        stack.pop();
      }
    }
  }
  
  return errors;
}

/**
 * Validate template syntax
 * @param {string} template - Template string to validate
 * @param {Object} options - Optional configuration
 * @returns {Object} Validation result with valid flag and errors array
 */
function validateTemplate(template, options = {}) {
  if (typeof template !== 'string') {
    return {
      valid: false,
      errors: [{
        line: 1,
        column: 1,
        type: 'INVALID_SYNTAX',
        message: 'Template must be a string',
        code: 'ERR_TEMPLATE_INVALID_INPUT'
      }]
    };
  }

  const errors = [];
  
  // Run all validation checks
  errors.push(...validateVariables(template));
  errors.push(...validateConditionalBlocks(template));
  errors.push(...validatePartialIncludes(template));
  errors.push(...validateGeneralSyntax(template));
  errors.push(...validateNestedStructures(template));
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Render a template string with variables (alias for processTemplate)
 * @param {string} templateString - Template string
 * @param {Object} variables - Variables for substitution
 * @param {Object} options - Optional configuration options
 * @returns {Object} Rendered result with success/error - caller must check success flag
 */
function render(templateString, variables, options) {
  const result = processTemplate(templateString, variables, options);
  
  // Return full result object for error handling
  return result;
}

module.exports = {
  processTemplate,
  validateTemplate,
  render
};
