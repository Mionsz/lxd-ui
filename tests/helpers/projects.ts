import { randomNameSuffix } from "./name";
import { Page } from "@playwright/test";
import { TIMEOUT } from "./constants";

export const randomProjectName = (): string => {
  return `playwright-project-${randomNameSuffix()}`;
};

export const createProject = async (page: Page, project: string) => {
  await page.goto("/ui/");
  await page.getByRole("button", { name: "default" }).click();
  await page.getByRole("button", { name: "Create project" }).click();
  await page.getByPlaceholder("Enter name").click();
  await page.getByPlaceholder("Enter name").fill(project);
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForSelector(`text=Project ${project} created.`, TIMEOUT);
};

export const renameProject = async (
  page: Page,
  oldName: string,
  newName: string
) => {
  await page.getByRole("link", { name: "Configuration" }).click();
  await page
    .getByRole("listitem", { name: oldName })
    .getByText(oldName)
    .click();
  await page.getByRole("textbox").first().press("Control+a");
  await page.getByRole("textbox").first().fill(newName);
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByText("Project renamed.").click();
};

export const deleteProject = async (page: Page, project: string) => {
  await page.goto("/ui/");
  await page.getByRole("button", { name: "default" }).click();
  await page.getByRole("link", { name: project }).click();
  await page.getByRole("link", { name: "Configuration" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await page
    .getByRole("dialog", { name: "Confirm delete" })
    .getByRole("button", { name: "Delete" })
    .click();
  await page.waitForSelector(`text=Project ${project} deleted.`, TIMEOUT);
};
