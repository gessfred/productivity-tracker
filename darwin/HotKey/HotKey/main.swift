//
//  main.swift
//  HotKey
//
//  Created by Frédéric Gessler on 05.03.2024.
//

import Foundation
import Cocoa
import MachO

var keyEvents: [(app: String, title: String, category: String, timestamp: String, interval: UInt64)] = []
var previousTime: UInt64 = mach_absolute_time()

let queue = DispatchQueue(label: "com.yourapp.keyEventQueue")

let tsFormatter = ISO8601DateFormatter()
tsFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds, .withTimeZone]
tsFormatter.timeZone = TimeZone.current

import ApplicationServices

func getActiveWindowTitle() -> String? {
    // Get the frontmost application
    guard let frontmostApp = NSWorkspace.shared.frontmostApplication else {
        return nil
    }
    
    let frontmostAppPID = frontmostApp.processIdentifier
    
    // Create an AXUIElement for the application
    let appElement = AXUIElementCreateApplication(frontmostAppPID)
    
    // Get the focused window of the application
    var focusedWindow: AnyObject?
    let result = AXUIElementCopyAttributeValue(appElement, kAXFocusedWindowAttribute as CFString, &focusedWindow)
    
    guard result == .success, let windowElement = focusedWindow else {
        return nil
    }
    
    // Get the title of the focused window
    var windowTitle: AnyObject?
    let titleResult = AXUIElementCopyAttributeValue(windowElement as! AXUIElement, kAXTitleAttribute as CFString, &windowTitle)
    
    if titleResult == .success, let title = windowTitle as? String {
        return title
    }
    
    return nil
}



func getActiveWindowName() -> String? {
    // Get the frontmost application
    guard let frontmostApp = NSWorkspace.shared.frontmostApplication else {
        print("no frontmost app")
        return nil
    }
    
    let frontmostAppPID = frontmostApp.processIdentifier
    
    // Get the list of windows
    if let windowList = CGWindowListCopyWindowInfo(.optionOnScreenOnly, kCGNullWindowID) as NSArray? {
        for window in windowList {
            if let windowInfo = window as? NSDictionary {
                // Check if the window belongs to the frontmost application
                if let windowOwnerPID = windowInfo[kCGWindowOwnerPID] as? pid_t,
                   windowOwnerPID == frontmostAppPID {
                    print("owner: \(windowInfo)")
                    // Get the window title
                    if let windowTitle = windowInfo[kCGWindowOwnerName] as? String {
                        return windowTitle
                    }
                }
            }
        }
    }
    
    return nil
}

func saveToCSV(filePath: String, data: [(app: String, title: String, category: String, timestamp: String, interval: UInt64)]) {
    var csvString = "Timestamp,Interval_ns,SeqNum,App,Title,Category\n"
    
    /*for event in data {
        
        csvString.append("\(event.timestamp),\(event.interval),0,\"\(event.app)\",\"\(event.title)\",\(event.category)\n")
    }*/
    for event in data {
            let escapedApp = event.app.replacingOccurrences(of: "\"", with: "\"\"")
            let escapedTitle = event.title.replacingOccurrences(of: "\"", with: "\"\"")
            let escapedCategory = event.category.replacingOccurrences(of: "\"", with: "\"\"")
            
            csvString.append("\(event.timestamp),\(event.interval),0,\"\(escapedApp)\",\"\(escapedTitle)\",\"\(escapedCategory)\"\n")
        }
    
    do {
        try csvString.write(toFile: filePath, atomically: true, encoding: .utf8)
    } catch {
        print("Failed to save file: \(error)")
    }
}
// https://forums.swift.org/t/recommended-way-to-measure-time-in-swift/33326
let eventMask = CGEventMask((1 << CGEventType.keyDown.rawValue) | (1 << CGEventType.keyUp.rawValue))
guard let eventTap = CGEvent.tapCreate(
    tap: .cgSessionEventTap, // cghidEventTap
    place: .headInsertEventTap,
    options: .defaultTap,
    eventsOfInterest: eventMask,
    callback: { (proxy, type, event, refcon) -> Unmanaged<CGEvent>? in
        let frontmost = NSWorkspace.shared.frontmostApplication
        var keyCat = "Default"
        if type == .keyDown {
            let keyCode = event.getIntegerValueField(.keyboardEventKeycode)
            // Define key categories
            switch keyCode {
            case 49: // Space
                keyCat = "Spacce"
            case 36, 76: // Enter and Numpad Enter
                keyCat = "Enter"
            case 0...9, 11...28, 31...50, 65, 67, 69, 75, 78, 81...92, 96...103, 105...107, 109, 111...117, 119...126:
                keyCat = "Alphanumeric"
            default:
                keyCat = "Other"
            }
        } else if type == .flagsChanged {
            keyCat = "Modifier"
        }
        queue.async {
            let ts = tsFormatter.string(from: Date())
            let now = mach_absolute_time()
            let diff = now - previousTime
            previousTime = now
            keyEvents.append((
                app: String(describing:frontmost?.localizedName ?? ".unknown" ),
                title: getActiveWindowTitle() ?? "null",
                category: keyCat,
                timestamp: ts,
                diff
            ))
            if keyEvents.count > 100 {
                let now  = Int(Date().timeIntervalSince1970)
                saveToCSV(filePath: "/Users/fredericgessler/Documents/bootstrap/productivity-tracker/darwin/HotKey/data/\(now).csv", data: keyEvents)
                keyEvents = []
            }
        }
        return Unmanaged.passRetained(event)
    },
    userInfo: nil
) else {
    print("Failed to create event tap")
    exit(1)
}

let runLoopSource = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, eventTap, 0)
let runLoop = CFRunLoopGetCurrent()
let runLoopMode = CFRunLoopMode.commonModes
CFRunLoopAddSource(runLoop, runLoopSource, runLoopMode)
CGEvent.tapEnable(tap: eventTap, enable: true)
CFRunLoopRun()
