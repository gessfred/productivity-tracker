//
//  Utils.swift
//  KeyTime
//
//  Created by Frédéric Gessler on 10.02.2025.
//

import Foundation

func getDataDirectory() -> String? {
    let fileManager = FileManager.default
    if let appSupportDir = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first {
        let directory = appSupportDir.appendingPathComponent("HotKey/data", isDirectory: true)
        
        do {
            if !fileManager.fileExists(atPath: directory.path) {
                try fileManager.createDirectory(at: directory, withIntermediateDirectories: true, attributes: nil)
            }
            return directory.path
        } catch {
            print("Failed to create directory: \(error)")
        }
    }
    return nil
}
