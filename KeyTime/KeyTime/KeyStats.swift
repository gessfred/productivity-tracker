//
//  KeyStats.swift
//  KeyTime
//
//  Created by Frédéric Gessler on 26.01.2025.
//

import Foundation
import DuckDB
@preconcurrency import TabularData

class KeyStats {
    private let db: Connection
    private let rootFs: String
    init() {
        self.db = {
            do {
                let database = try Database(store: .file(at: URL(fileURLWithPath: "keytime.db")))
                let connection = try database.connect()
                return connection
            } catch {
                fatalError("Failed to initialize database: \(error)")
            }
        }()
        let fileManager = FileManager.default
        if let appSupportDir = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first {
            self.rootFs = appSupportDir.appendingPathComponent("HotKey", isDirectory: true).path()
        } else {
            self.rootFs = ""
        }
        do {
            try queryToObjects(sql: "select 1 as test")
            try createViews()
        }
        catch {
            print("couldn't create views: \(error)")
        }
    }
    
    func queryToObjects(sql: String) throws -> [[String: Any]] {
        let result = try self.db.query(sql)
        let cola = result[0].cast(to: Int.self)
        print("result: \(cola)")
        result
        return []
    }
    
    func activeTimeByApp() -> [Any] {
        do {
            let res = try self.db.execute("""
            select
                  app,
                  sum(duration) as total_time
                from active_sessions_by_app
                group by all
                order by total_time desc
            """)
            print(res)
            return []
        }
        catch {
            return []
        }
    }
    
    func activeSessionsByApp_df() throws -> DataFrame {
        let res = try self.db.query("""
            select app, session_start::varchar as session_start, session_end::varchar as session_end
            from active_sessions_by_app
            where session_start > now() - interval '24 hours'
        """)
        /*var elements = [GanttElement]()
        for (title, (start, end)) in zip(res[0].cast(to: String.self), zip(res[3].cast(to: Date.self), res[4].cast(to: Date.self))) {
            elements.append(GanttElement(name: title., start: start, end: end))
        }*/
        //print("gantt elements \(elements)")
        return DataFrame(columns: [
            TabularData.Column(res[0].cast(to: String.self)).eraseToAnyColumn(),
            TabularData.Column(res[1].cast(to: String.self)).eraseToAnyColumn(),
            TabularData.Column(res[2].cast(to: String.self)).eraseToAnyColumn()
        ])
    }
    func parseDate(from dateString: String) -> Foundation.Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss.SSS"
        formatter.locale = Locale(identifier: "en_US_POSIX") // Ensures consistency
        formatter.timeZone = TimeZone.current // Adjust as needed
        
        return formatter.date(from: dateString)
    }
    func activeSessionByApp() throws -> [GanttElement]
    {
        let df = try activeSessionsByApp_df()
        let starts = df.columns[1].assumingType(String.self)
        let ends = df.columns[2].assumingType(String.self)//.filled(with: -1)
        let names = df.columns[0].assumingType(String.self)
        var rows = [GanttElement]()
        for (title, (start, end)) in zip(names, zip(starts, ends)) {
            print("row: start=\(start); end=\(end); title=\(title)")
            if let start = start, let end = end, let title = title {
                rows.append(GanttElement(name: title, start: parseDate(from: start)!, end: parseDate(from: end)!))
            }
        }
        //for
        return rows
    }
    
    func createViews() throws {
        let rawDataRoot = getDataDirectory()!
        print("data directory for views: \(rawDataRoot)")
        try self.db.execute("""
            create or replace view active_sessions_by_app
                  as
                  with event_sequence as (
                    select
                        app,
                        timestamp as ts,
                        lag(timestamp) over (
                            partition by app
                            order by timestamp asc
                        ) as prev_ts,
                        row_number() over (
                            partition by app
                            order by timestamp desc
                        ) as record_rank,
                        extract(epoch from ts - prev_ts) / 60 as diff_s,
                        extract(epoch from now() - ts) / 60 as age_s
                    from read_csv('\(rawDataRoot)/*.csv', ignore_errors=true)
                ),
                sessions_numbered as (
                    select
                        ts::date as session_date,
                        *,
                        sum((coalesce(diff_s > 10, true))::int) over (
                            partition by app
                            order by ts asc
                        ) as session_number
                    from event_sequence
                )
                select
                    app,
                    session_date,
                    session_number,
                    min(ts) as session_start,
                    max(ts) as session_end,
                    extract(epoch from session_end - session_start) as duration
                from sessions_numbered
                group by all
                having duration > 0 --and session_start > now() - interval '24 hours'
                order by app, session_date desc, session_number asc
        """)
        
        try self.db.execute("""
        create or replace view active_sessions
              as
              with event_sequence as (
                select
                    app,
                    timestamp as ts,
                    lag(timestamp) over (
                        order by timestamp asc
                    ) as prev_ts,
                    row_number() over (
                        partition by app
                        order by timestamp desc
                    ) as record_rank,
                    extract(epoch from ts - prev_ts) / 60 as diff_s,
                    extract(epoch from now() - ts) / 60 as age_s
                from read_csv('\(rawDataRoot)/*.csv', ignore_errors=true)
            ),
            sessions_numbered as (
                select
                    ts::date as session_date,
                    *,
                    sum((coalesce(diff_s > 3, true))::int) over (
                        order by ts asc
                    ) as session_number
                from event_sequence
            )
            select
                session_date,
                session_number,
                min(ts) as session_start,
                max(ts) as session_end,
                extract(epoch from session_end - session_start) as duration
            from sessions_numbered
            group by all
            having duration > 0  and session_start > now() - interval '24 hours'
            order by session_date desc, session_number asc
        """)
    }
}
