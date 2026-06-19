// Safe DOM creation helpers : never use innerHTML to avoid XSS vulnerabilities

// Creates an element with an optional class and text content
export function createElement(tag, className = '', text = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text)      el.textContent = text;
  return el;
}

// Removes all children from a container node
export function clearContainer(container) {
  while (container.firstChild) container.removeChild(container.firstChild);
}
