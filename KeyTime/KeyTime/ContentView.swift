import SwiftUI
import Charts
import DuckDB
import Foundation
@preconcurrency import TabularData

struct DataPoint: Identifiable {
    var id = UUID()
    var time: Double
    var value: Double
}

func typingCurrent() {
    
}

struct ContentView: View {
    
    private enum DataStatus {
        case loaded([GanttElement])
        case nodata(Error?)
    }
    @State private var state = DataStatus.nodata(nil)
    
    //private struct
    //@StateObject var settings = Settings()
    let keyTracker = KeyTracker()
    var keyStats: KeyStats
    
    //
    var body: some View {
        
        VStack {
            Image(systemName: "globe")
                .imageScale(.large)
                .foregroundStyle(.tint)
            Text("Sessions by App")
            Group {
                switch state {
                //case .nodata(err):
                //    Text("loading...")
                case .loaded(let elements):
                    GanttChartView(elements: elements)
                default:
                    Text("Unknown state")
                }
            }
        }
        .padding()
        .task {
            do {
                print("get active sessions by app")
                let elements = try self.keyStats.activeSessionByApp()
                print("loaded: \(elements)")
                self.state = .loaded(elements)
            }
            catch {
                print("Failed to get data \(error)")
            }
        }
    }
    
    
}

/*
#Preview {
    ContentView(keyStats: KeyStats())
}*/

