import json
import math
import os
import sys
from datetime import datetime, timedelta


WIND_DIR = r"C:\Wind\Wind.NET.Client\WindNET\x64"


def add_wind_path():
    os.chdir(WIND_DIR)
    if hasattr(os, "add_dll_directory"):
        os.add_dll_directory(WIND_DIR)
    if WIND_DIR not in sys.path:
        sys.path.insert(0, WIND_DIR)


def compact_day(value):
    return "".join(ch for ch in str(value or "") if ch.isdigit())


def iso_day(value):
    text = compact_day(value)
    if len(text) != 8:
        return str(value or "")
    return f"{text[:4]}-{text[4:6]}-{text[6:8]}"


def wind_code(code):
    c = compact_day(code)
    if not c:
        return ""
    if c.startswith(("60", "68", "90")):
        return f"{c}.SH"
    if c.startswith(("4", "8", "92")):
        return f"{c}.BJ"
    return f"{c}.SZ"


def original_code(wind_code_value):
    return str(wind_code_value or "").split(".")[0]


def number_or_none(value):
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    try:
        n = float(value)
    except Exception:
        return None
    if not math.isfinite(n):
        return None
    return n


def recent_trading_days(w, end_day, count):
    end_iso = iso_day(end_day)
    end_dt = datetime.strptime(end_iso, "%Y-%m-%d")
    start_dt = end_dt - timedelta(days=max(90, int(count) * 3))
    data = w.tdays(start_dt.strftime("%Y-%m-%d"), end_iso, "")
    if data.ErrorCode != 0:
        raise RuntimeError(f"Wind tdays failed: {data.ErrorCode}")
    days = [iso_day(t) for t in getattr(data, "Times", [])]
    if not days and getattr(data, "Data", None):
        days = [iso_day(t) for t in data.Data[0]]
    return days[-int(count):]


def query_field(w, codes, field, start_day, end_day):
    data = w.wsd(",".join(codes), field, start_day, end_day, "PriceAdj=F")
    if data.ErrorCode != 0:
        raise RuntimeError(f"Wind wsd {field} failed: {data.ErrorCode}; {getattr(data, 'Data', '')}")
    return {
        "codes": list(getattr(data, "Codes", [])),
        "times": [iso_day(t) for t in getattr(data, "Times", [])],
        "data": list(getattr(data, "Data", [])),
    }


def main():
    if len(sys.argv) < 3:
        raise SystemExit("Usage: wind-close-db-sync.py input.json output.json")

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    with open(input_path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    add_wind_path()
    from WindPy import w

    start_result = w.start(waitTime=20)
    if getattr(start_result, "ErrorCode", -1) != 0:
        raise RuntimeError(f"Wind start failed: {start_result}")

    end_day = iso_day(payload.get("endDay"))
    day_count = int(payload.get("days") or 31)
    trading_days = payload.get("targetDays") or recent_trading_days(w, end_day, day_count)
    trading_days = [iso_day(day) for day in trading_days if iso_day(day)]
    if not trading_days:
        raise RuntimeError("No trading days resolved")

    start_day = trading_days[0]
    end_day = trading_days[-1]
    stocks = []
    seen = set()
    for stock in payload.get("stocks") or []:
        code = compact_day(stock.get("code"))
        name = str(stock.get("name") or "").strip()
        wc = wind_code(code)
        if not code or not name or not wc or wc in seen:
            continue
        seen.add(wc)
        stocks.append({"code": code, "name": name, "windCode": wc})

    batch_size = int(payload.get("batchSize") or 300)
    rows_by_day = {day: {} for day in trading_days}
    errors = []
    processed = 0

    for i in range(0, len(stocks), batch_size):
        batch = stocks[i:i + batch_size]
        wind_codes = [stock["windCode"] for stock in batch]
        try:
            close_result = query_field(w, wind_codes, "close", start_day, end_day)
        except Exception as err:
            errors.append({"field": "close", "offset": i, "error": str(err)})
            continue
        try:
            gain_result = query_field(w, wind_codes, "pct_chg", start_day, end_day)
            gain_by_code = {
                original_code(code): values
                for code, values in zip(gain_result["codes"], gain_result["data"])
            }
            gain_times = gain_result["times"]
        except Exception as err:
            errors.append({"field": "pct_chg", "offset": i, "error": str(err)})
            gain_by_code = {}
            gain_times = []

        stock_by_code = {stock["code"]: stock for stock in batch}
        for returned_code, close_values in zip(close_result["codes"], close_result["data"]):
            code = original_code(returned_code)
            stock = stock_by_code.get(code)
            if not stock:
                continue
            gain_values = gain_by_code.get(code) or []
            for idx, day in enumerate(close_result["times"]):
                if day not in rows_by_day:
                    continue
                close = number_or_none(close_values[idx] if idx < len(close_values) else None)
                if close is None:
                    continue
                gain = None
                if gain_times == close_result["times"] and idx < len(gain_values):
                    gain = number_or_none(gain_values[idx])
                rows_by_day[day][code] = {
                    "code": code,
                    "name": stock["name"],
                    "close": close,
                    "gain": gain,
                }
        processed += len(batch)

    result = {
        "ok": True,
        "source": "wind/wsd",
        "endDay": end_day,
        "tradingDays": trading_days,
        "processed": processed,
        "total": len(stocks),
        "errors": errors,
        "rowsByDay": {
            day: list(rows.values())
            for day, rows in rows_by_day.items()
        },
        "days": [
            {"day": day, "count": len(rows_by_day[day])}
            for day in trading_days
        ],
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)
    print(json.dumps({
        "ok": True,
        "source": result["source"],
        "processed": processed,
        "days": result["days"],
        "errorCount": len(errors),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
