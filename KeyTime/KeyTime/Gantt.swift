import SwiftUI
import Charts
import Foundation

struct GanttElement: Identifiable {
    let id = UUID()
    let name: String
    let start: Date
    let end: Date
}

struct GanttChartView: View {
    let elements: [GanttElement]  // Pass elements dynamically

    var body: some View {
        Chart(elements) { element in
            BarMark(
                xStart: .value("Start", element.start),
                xEnd: .value("End", element.end),
                y: .value("Task", element.name)
            )
            .foregroundStyle(.blue)
        }
        .chartXAxis {
            AxisMarks(format: .dateTime.hour().minute())
        }
        .frame(height: 300)
        .padding()
    }
}
