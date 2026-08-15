import DynamicDetailSection from "@/data/componentsDynamicDetailSection";
import { ELECTRONICS_LEAVES, type Lang } from "@/data/electronics-categories";

const sampleAttributes: Record<string, Record<string, any>> = {
  "mobile-phones": {
    brand: "samsung",
    model: "Galaxy S24",
    storage: "256 GB",
    ram: "8 GB",
    condition: "used",
    battery_health: 87,
    color: "black",
    location: "kabul",
  },
  tablets: {
    brand: "apple",
    model: "iPad Air 5",
    storage: "256 GB",
    ram: "8 GB",
    screen_size: "10",
    sim_support: "sim",
    condition: "used",
    location: "kabul",
  },
  "smart-watches": {
    brand: "apple",
    model: "Watch Series 9",
    size: "45mm",
    originality: "original",
    condition: "used",
    color: "silver",
    location: "kabul",
  },
  laptops: {
    brand: "apple",
    model: "MacBook Air",
    processor: "M2",
    cpu_generation: "2022",
    ram: "16 GB",
    storage: "512 GB",
    graphics: "Integrated",
    screen_size: "13.6",
    condition: "used",
    location: "kabul",
  },
  tv: {
    brand: "samsung",
    screen_size: "55\"",
    storage: "512 GB",
    tv_type: "smart_tv",
    resolution: "4k",
    condition: "used",
    location: "kabul",
  },
  "game-consoles": {
    console_type: "playstation",
    model: "PS5",
    storage: "825 GB",
    controllers: "2",
    jailbroken: "no",
    condition: "used",
    location: "kabul",
  },
  "network-equipment": {
    network_type: "router",
    brand: "tp_link",
    model: "Archer C6",
    speed_ports: "1000 Mbps",
    condition: "used",
    location: "kabul",
  },
  "solar-power": {
    power_type: "solar_panel",
    brand: "renogy",
    capacity: "200W",
    voltage: "12V",
    fuel_type: "solar",
    condition: "used",
    location: "kabul",
  },
  "mobile-accessories": {
    accessory_type: "charger",
    brand: "anker",
    originality: "original",
    condition: "new",
    location: "kabul",
  },
  "computer-accessories": {
    accessory_type: "keyboard",
    brand: "logitech",
    connection: "wireless",
    condition: "used",
    location: "kabul",
  },
};

const sampleFeatures: Record<string, string[]> = {
  "mobile-phones": ["with_box", "with_charger", "no_scratches"],
  tablets: ["with_box", "exchange_possible"],
  "smart-watches": ["with_box"],
  laptops: ["with_box", "registered"],
  tv: ["with_box"],
  "game-consoles": ["with_box"],
  "network-equipment": ["with_box"],
  "solar-power": ["with_box"],
  "mobile-accessories": ["with_box"],
  "computer-accessories": ["with_box"],
};

export default function ElectronicsDetailPreviewPage() {
  const lang: Lang = "en";

  return (
    <main style={{ padding: 24, background: "#f7f7f7", color: "#111" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Electronics detail preview</h1>
      <div style={{ display: "grid", gap: 24 }}>
        {ELECTRONICS_LEAVES.map((leaf) => {
          const attrs = sampleAttributes[leaf.id as keyof typeof sampleAttributes] ?? {};
          const features = sampleFeatures[leaf.id as keyof typeof sampleFeatures] ?? [];

          return (
            <section
              key={leaf.id}
              style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                padding: 20,
                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              }}
            >
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{leaf.labels[lang]}</h2>
              <DynamicDetailSection leafId={leaf.id} lang={lang} attributes={attrs} features={features} />
            </section>
          );
        })}
      </div>
    </main>
  );
}
