import { Page } from "@playwright/test";
import { TIMEOUT } from "./constants";
import { randomNameSuffix } from "./name";

export const randomInstanceName = (): string => {
  return `playwright-instance-${randomNameSuffix()}`;
};

export const createInstance = async (
  page: Page,
  instance: string,
  type = "container"
) => {
  await page.goto("/ui/");
  await page
    .getByRole("link", { name: "Instances", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Create instance" }).click();
  await page.getByLabel("Instance name").click();
  await page.getByLabel("Instance name").fill(instance);
  await page.getByRole("button", { name: "Browse images" }).click();
  await page.getByPlaceholder("Search an image").click();
  await page.getByPlaceholder("Search an image").fill("alpine");
  await page
    .getByRole("row", {
      name: "Distribution Release Variant Type Alias Action",
    })
    .getByRole("button", { name: "Select" })
    .first()
    .click();
  await page
    .getByRole("combobox", { name: "Instance type" })
    .selectOption(type);
  await page.getByRole("button", { name: "Create" }).first().click();

  await page.waitForSelector(`text=Launched instance ${instance}.`, TIMEOUT);
};

export const visitInstance = async (page: Page, instance: string) => {
  await page.goto("/ui/");
  await page.getByPlaceholder("Search").click();
  await page.getByPlaceholder("Search").fill(instance);
  await page.getByRole("link", { name: instance }).first().click();
};

export const editInstance = async (page: Page, instance: string) => {
  await visitInstance(page, instance);
  await page.getByTestId("tab-link-Configuration").click();
  await page.getByRole("button", { name: "Edit instance" }).click();
};

export const saveInstance = async (page: Page) => {
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForSelector(`text=Instance updated.`, TIMEOUT);
};

export const deleteInstance = async (page: Page, instance: string) => {
  await visitInstance(page, instance);
  await page.getByRole("button", { name: "Delete" }).click();
  await page
    .getByRole("dialog", { name: "Confirm delete" })
    .getByRole("button", { name: "Delete" })
    .click();
  await page.waitForSelector(`text=Instance ${instance} deleted.`, TIMEOUT);
};

export const hasInstance = async (page: Page, instance: string) => {
  await page.goto("/ui/");
  await page.getByPlaceholder("Search").click();
  await page.getByPlaceholder("Search").fill(instance);
  return await page.getByRole("link", { name: instance }).first().isVisible();
};

export const renameInstance = async (
  page: Page,
  oldName: string,
  newName: string
) => {
  await visitInstance(page, oldName);
  await page
    .getByRole("listitem", { name: oldName })
    .getByText(oldName)
    .click();
  await page.getByRole("textbox").press("Control+a");
  await page.getByRole("textbox").fill(newName);
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByText("Instance renamed.").click();
};
