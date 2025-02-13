import Foundation
import Cocoa
import ApplicationServices
import DuckDB

class KeyTracker {
    private var keyEvents: [(app: String, title: String, category: String, timestamp: String, interval: UInt64)] = []
    private var previousTime: UInt64 = mach_absolute_time()
    private let queue = DispatchQueue(label: "com.yourapp.keyEventQueue")
    private let tsFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds, .withTimeZone]
        formatter.timeZone = TimeZone.current
        return formatter
    }()
    private var eventTap: CFMachPort?

    public func track() {
        let eventMask = CGEventMask((1 << CGEventType.keyDown.rawValue) | (1 << CGEventType.keyUp.rawValue))

        guard let tap = CGEvent.tapCreate(
            tap: .cgSessionEventTap,
            place: .headInsertEventTap,
            options: .defaultTap,
            eventsOfInterest: eventMask,
            callback: eventCallback,
            userInfo: UnsafeMutableRawPointer(Unmanaged.passUnretained(self).toOpaque())
        ) else {
            print("Failed to create event tap")
            return
        }
        print("tapping...")
        self.eventTap = tap
        let runLoopSource = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0)
        CFRunLoopAddSource(CFRunLoopGetCurrent(), runLoopSource, .commonModes)
        CGEvent.tapEnable(tap: tap, enable: true)
        CFRunLoopRun()
        print("connecting DuckDB")
        var duckdb: Connection = {
            do {
                let database = try Database(store: .inMemory)
                let connection = try database.connect()
                return connection
            } catch {
                fatalError("Failed to initialize database: \(error)")
            }
        }()
        do {
            let result = try duckdb.query("""
                  SELECT SeqNum, App
                  from read_csv("/Users/fredericgessler/Library/Containers/fred.KeyTime/Data/Library/Application Support/HotKey/data/*.csv")
                  limit 10
                  """)

            // Cast our DuckDB columns to their native Swift
            // equivalent types
            let seqNum = result[0].cast(to: Int.self)
            let appName = result[1].cast(to: String.self)
            print("seq: \(seqNum), app: \(appName)")
        }
        catch {
            print("Failed query: \(error)")
        }
        print("conneced")
    }

    /*private func eventCallback(proxy: CGEventTapProxy, type: CGEventType, event: CGEvent, refcon: UnsafeMutableRawPointer?) -> Unmanaged<CGEvent>? {
        guard let refcon = refcon else { return Unmanaged.passRetained(event) }
        let tracker = Unmanaged<KeyTracker>.fromOpaque(refcon).takeUnretainedValue()

        tracker.handleKeyEvent(type: type, event: event)
        return Unmanaged.passRetained(event)
    }*/

    func handleKeyEvent(type: CGEventType, event: CGEvent) {
        guard let frontmostApp = NSWorkspace.shared.frontmostApplication else { return }

        let keyCat: String
        if type == .keyDown {
            let keyCode = event.getIntegerValueField(.keyboardEventKeycode)
            keyCat = categorizeKey(keyCode: keyCode)
        } else if type == .flagsChanged {
            keyCat = "Modifier"
        } else {
            keyCat = "Other"
        }

        queue.async {
            let timestamp = self.tsFormatter.string(from: Date())
            let now = mach_absolute_time()
            let diff = now - self.previousTime
            self.previousTime = now

            self.keyEvents.append((
                app: frontmostApp.localizedName ?? "Unknown",
                title: self.getActiveWindowTitle() ?? "Untitled",
                category: keyCat,
                timestamp: timestamp,
                interval: diff
            ))

            if self.keyEvents.count > 100 {
                self.saveAndClearEvents()
            }
        }
    }

    private func categorizeKey(keyCode: Int64) -> String {
        switch keyCode {
        case 49:
            return "Space"
        case 36, 76:
            return "Enter"
        case 0...9, 11...28, 31...50, 65, 67, 69, 75, 78, 81...92, 96...103, 105...107, 109, 111...117, 119...126:
            return "Alphanumeric"
        default:
            return "Other"
        }
    }

    private func getActiveWindowTitle() -> String? {
        guard let frontmostApp = NSWorkspace.shared.frontmostApplication else { return nil }

        let appElement = AXUIElementCreateApplication(frontmostApp.processIdentifier)
        var focusedWindow: AnyObject?
        let result = AXUIElementCopyAttributeValue(appElement, kAXFocusedWindowAttribute as CFString, &focusedWindow)

        guard result == .success, let windowElement = focusedWindow else { return nil }

        let axWindowElement = windowElement as! AXUIElement

        var windowTitle: AnyObject?
        let titleResult = AXUIElementCopyAttributeValue(axWindowElement, kAXTitleAttribute as CFString, &windowTitle)

        return titleResult == .success ? windowTitle as? String : nil
    }

    private func saveAndClearEvents() {
        print("saving events")
        let fileManager = FileManager.default
        if let appSupportDir = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first {
            let directory = appSupportDir.appendingPathComponent("HotKey/data", isDirectory: true)
            
            do {
                // Create the directory if it doesn't exist
                if !fileManager.fileExists(atPath: directory.path) {
                    try fileManager.createDirectory(at: directory, withIntermediateDirectories: true, attributes: nil)
                }
                
                // Save the file
                let filePath = directory.appendingPathComponent("\(Int(Date().timeIntervalSince1970)).csv", isDirectory: false)
                print(filePath.path)
                try saveToCSV(filePath: "\(filePath.path)", data: self.keyEvents)
                print("File saved to: \(filePath)")
            } catch {
                print("Failed to save file: \(error)")
            }
        }
        //let filePath = "/Users/fredericgessler/Documents/bootstrap/productivity-tracker/darwin/HotKey/data/\(Int(Date().timeIntervalSince1970)).csv"
        //saveToCSV(filePath: filePath, data: self.keyEvents)
        self.keyEvents = []
    }

    private func saveToCSV(filePath: String, data: [(app: String, title: String, category: String, timestamp: String, interval: UInt64)]) {
        var csvString = "Timestamp,Interval_ns,SeqNum,App,Title,Category\n"
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
}

private func eventCallback(proxy: CGEventTapProxy, type: CGEventType, event: CGEvent, refcon: UnsafeMutableRawPointer?) -> Unmanaged<CGEvent>? {
    /*Needs to be global*/
    guard let refcon = refcon else { return Unmanaged.passRetained(event) }
    let tracker = Unmanaged<KeyTracker>.fromOpaque(refcon).takeUnretainedValue()

    tracker.handleKeyEvent(type: type, event: event)
    return Unmanaged.passRetained(event)
}
