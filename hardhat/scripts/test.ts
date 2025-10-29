// import hre from "hardhat";

// /**
//  * Test script for CirclePool contract
//  * Tests all major contract functions
//  */
// async function main() {
//   const [deployer, member1, member2, member3] = await hre.ethers.getSigners();

//   console.log("🧪 CirclePool Contract Test Suite");
//   console.log("=====================================\n");

//   // Get the deployed contract address (update this with your deployed address)
//   const CONTRACT_ADDRESS = "0x341D33440f85B5634714740DfafF285323C4657C";
//   const CirclePool = await hre.ethers.getContractFactory("CirclePool");
//   const circlePool = CirclePool.attach(CONTRACT_ADDRESS);

//   console.log("📝 Contract Details:");
//   console.log("Address:", CONTRACT_ADDRESS);
//   console.log("Owner:", await circlePool.owner());
//   console.log("AI Agent:", await circlePool.aiAgent());
//   console.log("");

//   // Test 1: Register a Circle
//   console.log("📋 Test 1: Registering a new circle...");
//   const futureDate = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  
//   try {
//     const tx1 = await circlePool.registerCircle(
//       1000000000,  // 10 HBAR contribution
//       30,          // 30 days duration
//       futureDate,  // Start date
//       5,           // Max 5 members
//       5,           // 5% interest on loans
//       10           // Keep 10% in circle for loans
//     );
//     await tx1.wait();
//     console.log("✅ Circle registered successfully");
    
//     const totalCircles = await circlePool.totalCircles();
//     console.log("Total circles:", totalCircles.toString());
//   } catch (error: any) {
//     console.log("❌ Error registering circle:", error.message);
//   }
//   console.log("");

//   // Test 2: Get Circle Details
//   console.log("📋 Test 2: Getting circle details...");
//   try {
//     const circleDetails = await circlePool.getCircle(0);
//     console.log("✅ Circle details retrieved:");
//     console.log("  - Amount:", circleDetails[1].toString());
//     console.log("  - Duration:", circleDetails[3].toString());
//     console.log("  - Max Members:", circleDetails[0]);
//     console.log("  - Admin:", circleDetails[6]);
//   } catch (error: any) {
//     console.log("❌ Error getting circle details:", error.message);
//   }
//   console.log("");

//   // Test 3: Add Members
//   console.log("📋 Test 3: Adding members to circle...");
//   try {
//     // Note: In a real scenario, members need to be added one by one
//     const tx2 = await circlePool.addMember(member1.address, 0);
//     await tx2.wait();
//     console.log("✅ Member added:", member1.address);
    
//     // Add second member if deployer has HBAR to fund
//     const tx3 = await circlePool.addMember(member2.address, 0);
//     await tx3.wait();
//     console.log("✅ Member added:", member2.address);
//   } catch (error: any) {
//     console.log("❌ Error adding members:", error.message);
//   }
//   console.log("");

//   // Test 4: Check if address is member
//   console.log("📋 Test 4: Checking membership...");
//   try {
//     const isDeployerMember = await circlePool.isMember(0, deployer.address);
//     console.log("Deployer is member:", isDeployerMember);
    
//     const isMember1 = await circlePool.isMember(0, member1.address);
//     console.log("Member1 is member:", isMember1);
    
//     const isMember3 = await circlePool.isMember(0, member3.address);
//     console.log("Member3 is member:", isMember3);
//   } catch (error: any) {
//     console.log("❌ Error checking membership:", error.message);
//   }
//   console.log("");

//   // Test 5: Deposit HBAR
//   console.log("📋 Test 5: Depositing HBAR to circle...");
//   console.log("⚠️  Note: This requires HBAR in the deployer account");
//   try {
//     const depositAmount = 1000000000; // 10 HBAR in tinybars
//     const tx4 = await circlePool.depositCash(0, { value: depositAmount });
//     await tx4.wait();
//     console.log("✅ Deposit successful:", depositAmount.toString(), "tinybars");
    
//     const balance = await circlePool.getBalance(0, deployer.address);
//     console.log("Deployer balance in circle:", balance[0].toString());
//   } catch (error: any) {
//     console.log("❌ Error depositing:", error.message);
//     console.log("This is expected if deployer doesn't have HBAR");
//   }
//   console.log("");

//   // Test 6: Get Balance
//   console.log("📋 Test 6: Getting member balance...");
//   try {
//     const balance = await circlePool.getBalance(0, deployer.address);
//     console.log("✅ Balance retrieved:");
//     console.log("  - Contribution balance:", balance[0].toString());
//     console.log("  - Outstanding loan:", balance[1].toString());
//   } catch (error: any) {
//     console.log("❌ Error getting balance:", error.message);
//   }
//   console.log("");

//   // Test 7: Get All Circles
//   console.log("📋 Test 7: Getting all circles...");
//   try {
//     const circles = await circlePool.getCircles();
//     console.log("✅ Total circles found:", circles[0].length);
//     if (circles[0].length > 0) {
//       console.log("Circle IDs:", circles[0].map((id: bigint) => id.toString()));
//       console.log("Amounts:", circles[1].map((amt: bigint) => amt.toString()));
//     }
//   } catch (error: any) {
//     console.log("❌ Error getting circles:", error.message);
//   }
//   console.log("");

//   // Test 8: Check All Members Contributed
//   console.log("📋 Test 8: Checking if all members contributed...");
//   try {
//     const allContributed = await circlePool.checkAllMembersContributed(0);
//     console.log("All members contributed:", allContributed);
//   } catch (error: any) {
//     console.log("❌ Error checking contributions:", error.message);
//   }
//   console.log("");

//   // Test 9: Get Circle Payout Order
//   console.log("📋 Test 9: Getting payout order...");
//   try {
//     const payoutOrder = await circlePool.getCirclePayoutOrder(0);
//     console.log("✅ Payout order members:", payoutOrder.length);
//     payoutOrder.forEach((member: string, index: number) => {
//       console.log(`  ${index + 1}. ${member}`);
//     });
//   } catch (error: any) {
//     console.log("❌ Error getting payout order:", error.message);
//   }
//   console.log("");

//   // Test 10: Emergency Withdraw (Owner Only)
//   console.log("📋 Test 10: Testing emergency withdraw (owner only)...");
//   console.log("⚠️  Skipping actual withdraw to prevent fund loss");
//   try {
//     const contractBalance = await hre.ethers.provider.getBalance(CONTRACT_ADDRESS);
//     console.log("Contract HBAR balance:", hre.ethers.formatUnits(contractBalance, 8), "HBAR");
//     console.log("✅ Emergency withdraw function available (not executed)");
//   } catch (error: any) {
//     console.log("❌ Error:", error.message);
//   }
//   console.log("");

//   console.log("✅ Test suite completed!");
//   console.log("\n📊 Summary:");
//   console.log("- Contract address:", CONTRACT_ADDRESS);
//   console.log("- Network: Hedera Testnet");
//   console.log("- Owner:", deployer.address);
  
//   console.log("\n💡 Next Steps:");
//   console.log("1. Fund deployer account with HBAR for deposits");
//   console.log("2. Test loan processing (requires setting AI agent)");
//   console.log("3. Test actual payouts (requires all members depositing)");
//   console.log("4. View contract on HashScan:");
//   console.log("   https://hashscan.io/testnet/contract/" + CONTRACT_ADDRESS);
// }

// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });

