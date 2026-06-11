const Permission = require("../models/auth/RoleAndPermission/permission");
const Role = require("../models/auth/RoleAndPermission/Role");
const RolePermission = require("../models/auth/RoleAndPermission/RolePermission");

const seedBlogsPermissions = async () => {
  const sections = ["Blogs"];
  const actions = ["create", "edit", "delete", "view"];

  try {
    // 1. Find or create the admin role
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    
    if (!adminRole) {
      console.log("⚠️ Admin role not found. Skipping assignment.");
    }

    for (const section of sections) {
      for (const action of actions) {
        // 2. Find or create the permission
        const [permission, created] = await Permission.findOrCreate({
          where: { section, action },
          defaults: {
            description: `${action.charAt(0).toUpperCase() + action.slice(1)} permission for ${section}`,
          },
        });

        // 3. Assign permission to admin role if role exists
        if (adminRole) {
          await RolePermission.findOrCreate({
            where: {
              roleId: adminRole.id,
              permissionId: permission.id
            }
          });
        }
      }
    }
    console.log("✅ Blogs permissions seeded and assigned to admin successfully.");
  } catch (error) {
    console.error("❌ Error seeding Blogs permissions:", error);
  }
};

module.exports = seedBlogsPermissions;
