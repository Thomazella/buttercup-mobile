import { NativeModules, Platform } from "react-native";
import { EntryFinder } from "../library/buttercupCore";
import { getEntryPathString } from "./entry";

const { AutoFillBridge } = NativeModules;

// Note: AutoFillBridge is not available in jest, and cannot be mocked without mocking
//  every single NativeModule from node_modules as well (not something I have time to do)
//  Instead, just check for both the existence of AutoFillBridge and the value of DEVICE_SUPPORTS_AUTOFILL
//  - @se1exin 17/2/19
export const autoFillAvailable = AutoFillBridge && !!AutoFillBridge.DEVICE_SUPPORTS_AUTOFILL;

export function getAutoFillSystemStatus() {
    return new Promise((resolve, reject) => {
        if (autoFillAvailable) {
            return AutoFillBridge.getAutoFillSystemStatus().then(isAutoFillEnabled => {
                resolve(isAutoFillEnabled);
            });
        }
        resolve(false);
    });
}

export function openAutoFillSystemSettings() {
    return new Promise((resolve, reject) => {
        if (autoFillAvailable) {
            return AutoFillBridge.openAutoFillSystemSettings().then(() => {
                resolve();
            });
        }
        resolve(false);
    });
}

export function autoFillEnabledForSource(sourceID) {
    return new Promise((resolve, reject) => {
        if (autoFillAvailable) {
            return AutoFillBridge.getAutoFillEnabledSources().then(autoFillSources => {
                const isEnabled = autoFillSources.indexOf(sourceID) > -1;
                resolve(isEnabled);
            });
        }
        resolve(false);
    });
}

export function addSourceToAutoFill(sourceID, archive) {
    return new Promise((resolve, reject) => {
        if (autoFillAvailable) {
            // We need to flatten all the Archive Entries, then send them to the native module
            const finder = new EntryFinder([archive]);
            let entries = {}; // Entries will be keyed by ID

            // Create the Map to be sent to the AutoFill store, keyed by credential ID
            for (let entrySearchInfo of finder._items) {
                const entry = entrySearchInfo.entry;
                if (!entry.isInTrash()) {
                    entries[entry.id] = {
                        username: entry.getProperty("username"),
                        password: entry.getProperty("password"),
                        entryPath: getEntryPathString(sourceID, entry.id),
                        // Send all general urls so multiple page variants can be matched
                        urls: entry.getURLs("general")
                    };
                }
            }

            // Note: Entries are stored against their sourceID in case a source is deleted,
            // that way we can remove from AutoFill without needing to unlock the source (to find the archive ID)
            return AutoFillBridge.updateEntriesForSourceID(sourceID, entries).then(() => {
                resolve();
            });
        }
        resolve();
    });
}

export function removeSourceFromAutoFill(sourceID) {
    return new Promise((resolve, reject) => {
        if (autoFillAvailable) {
            return AutoFillBridge.removeEntriesForSourceID(sourceID).then(() => {
                resolve();
            });
        }
        resolve();
    });
}

export function completeAutoFillWithEntry(sourceID, entry) {
    return new Promise((resolve, reject) => {
        if (autoFillAvailable) {
            const username = entry.getProperty("username");
            const password = entry.getProperty("password");
            const entryPath = getEntryPathString(sourceID, entry.id);
            return AutoFillBridge.completeAutoFill(username, password, entryPath).then(() => {
                resolve();
            });
        }
        resolve();
    });
}

export function cancelAutoFill() {
    return new Promise((resolve, reject) => {
        if (autoFillAvailable) {
            return AutoFillBridge.cancelAutoFill().then(() => {
                resolve();
            });
        }
        resolve();
    });
}
