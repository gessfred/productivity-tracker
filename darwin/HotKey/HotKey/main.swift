//
//  main.swift
//  HotKey
//
//  Created by Frédéric Gessler on 05.03.2024.
//

import Foundation
import Cocoa
import MachO

var keyEvents: [(app: String, category: String, timestamp: String, interval: UInt64)] = []
var previousTime: UInt64 = mach_absolute_time()

let queue = DispatchQueue(label: "com.yourapp.keyEventQueue")

let tsFormatter = ISO8601DateFormatter()
tsFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds, .withTimeZone]
tsFormatter.timeZone = TimeZone.current

func saveToCSV(filePath: String, data: [(app: String, category: String, timestamp: String, interval: UInt64)]) {
    var csvString = "Timestamp,Interval_ns,SeqNum,App,Category\n"
    
    for event in data {
        
        csvString.append("\(event.timestamp),\(event.interval),0,\(event.app),\(event.category)\n")
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
        //print("\(String(describing:frontmost!.localizedName)),\(keyCat)")
        queue.async {
            //let dateFormatter = ISO8601DateFormatter()
            //let dateStr = dateFormatter.string(from: event.timestamp)
            var ts = tsFormatter.string(from: Date())
            let now = mach_absolute_time()
            let diff = now - previousTime
            //print(frontmost?.processIdentifier)
            previousTime = now
            keyEvents.append((
                app: String(describing:frontmost?.localizedName ?? ".unknown" ),
                category: keyCat,
                timestamp: ts,
                diff
            ))
            if keyEvents.count > 20 {
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
