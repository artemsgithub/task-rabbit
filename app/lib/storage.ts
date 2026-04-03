import { Project, Folder } from "./types";

const PROJECTS_KEY = "task-organizer-projects";
const FOLDERS_KEY = "task-organizer-folders";

// ── Projects ──

export function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function saveProject(project: Project): void {
  const projects = loadProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.unshift(project);
  }
  saveProjects(projects);
}

export function deleteProject(id: string): void {
  saveProjects(loadProjects().filter((p) => p.id !== id));
}

// ── Folders ──

export function loadFolders(): Folder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFolders(folders: Folder[]): void {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

export function createFolder(name: string): Folder {
  const folders = loadFolders();
  const maxOrder = folders.reduce((max, f) => Math.max(max, f.sortOrder), -1);
  const folder: Folder = {
    id: generateId(),
    name,
    sortOrder: maxOrder + 1,
  };
  folders.push(folder);
  saveFolders(folders);
  return folder;
}

export function renameFolder(id: string, name: string): void {
  const folders = loadFolders();
  const folder = folders.find((f) => f.id === id);
  if (folder) {
    folder.name = name;
    saveFolders(folders);
  }
}

export function deleteFolder(id: string): void {
  saveFolders(loadFolders().filter((f) => f.id !== id));
  // Unfile projects in the deleted folder
  const projects = loadProjects().map((p) =>
    p.folderId === id ? { ...p, folderId: undefined } : p
  );
  saveProjects(projects);
}

// ── Helpers ──

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
