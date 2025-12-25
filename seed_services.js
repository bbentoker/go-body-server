const fs = require('fs');
const path = require('path');
const {
    sequelize,
    ServiceCategory,
    Service,
    ServiceVariant
} = require('./src/models');

const servicesPath = path.join(__dirname, 'src/utils/services.json');

async function seedServices() {
    const transaction = await sequelize.transaction();

    try {
        console.log('🔄 Connecting to database...');
        // Ensure DB connection
        await sequelize.authenticate();
        console.log('✅ Database connected.');

        console.log(`📖 Reading services from ${servicesPath}...`);
        const content = fs.readFileSync(servicesPath, 'utf8');
        const servicesData = JSON.parse(content);

        for (const [categoryName, servicesList] of Object.entries(servicesData)) {
            console.log(`\n📂 Processing Category: "${categoryName}"`);

            // 1. Find or Create Category
            const [category] = await ServiceCategory.findOrCreate({
                where: { name: categoryName },
                defaults: {
                    description: `${categoryName} category`,
                    is_active: true
                },
                transaction
            });
            console.log(`   -> Category ID: ${category.service_category_id}`);

            for (const serviceData of servicesList) {
                console.log(`   🔹 Processing Service: "${serviceData.service_name}"`);

                // 2. Create Service
                const service = await Service.create({
                    name: serviceData.service_name,
                    description: serviceData.description || '',
                    service_category_id: category.service_category_id,
                    is_active: true
                }, { transaction });

                // 3. Create Variants
                const variations = serviceData.variations || [];
                const prices = serviceData.prices || [];

                if (variations.length !== prices.length) {
                    console.warn(`   ⚠️ Warning: Mismatch in variations and prices count for "${serviceData.service_name}". Using minimum length.`);
                }

                const count = Math.min(variations.length, prices.length);

                for (let i = 0; i < count; i++) {
                    const rawDuration = variations[i];
                    const rawPrice = prices[i];

                    // Parse duration: Extract first number, default to 30 if not found
                    let duration = 30;
                    const durationMatch = rawDuration.match(/\d+/);
                    if (durationMatch) {
                        duration = parseInt(durationMatch[0], 10);
                    }

                    // Parse price: Remove non-numeric chars except dot
                    const price = parseFloat(rawPrice.replace(/[^0-9.]/g, ''));

                    await ServiceVariant.create({
                        service_id: service.service_id,
                        name: rawDuration, // Using the variation string as name, e.g., "30 (bölgesel)"
                        duration_minutes: duration,
                        price: price,
                        is_active: true
                    }, { transaction });

                    console.log(`      -> Added Variant: ${rawDuration} min / ${price} TL`);
                }
            }
        }

        await transaction.commit();
        console.log('\n✅ Seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        await transaction.rollback();
        console.error('\n❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedServices();
