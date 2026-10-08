import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  addAucationApi, addBidApi, changeCoverApi, deleteAllAucationsApi, deleteAucationApi, deleteBidApi,
  getAucationApi, getAucationsApi, updateAucationApi,
} from '../api/aucationApi'
import { getErrorMessage } from '../../../helpers/toolsHelper'

export const useAucationsStore = defineStore('aucations', () => {
  const aucations = ref([])
  const aucation = ref(null)
  const isAucation = ref(false)

  const isAucationAdd = ref(false)
  const isAucationAdded = ref(false)
  const isAucationChange = ref(false)
  const isAucationChanged = ref(false)
  const isAucationChangeCover = ref(false)
  const isAucationChangedCover = ref(false)
  const isAucationDelete = ref(false)
  const isAucationDeleted = ref(false)
  const isBidAdd = ref(false)
  const isBidAdded = ref(false)
  const isBidDelete = ref(false)
  const isBidDeleted = ref(false)
  const isAucationDeleteAll = ref(false)
  const isAucationDeletedAll = ref(false)

  async function run(pending, fn) {
    pending.value = true
    try {
      return { ok: true, message: await fn() }
    } catch (error) {
      return { ok: false, message: getErrorMessage(error), statusCode: error.statusCode }
    } finally {
      pending.value = false
    }
  }

  async function mutate(pending, done, fn) {
    done.value = false
    const result = await run(pending, async () => (await fn()).message)
    done.value = result.ok
    return result
  }

  const fetchAucations = (params) =>
    run(isAucation, async () => (aucations.value = (await getAucationsApi(params)).data.aucations))

  const fetchAucation = (id) =>
    run(isAucation, async () => (aucation.value = (await getAucationApi(id)).data.aucation))

  const addAucation = (payload) => mutate(isAucationAdd, isAucationAdded, () => addAucationApi(payload))
  const changeAucation = (id, payload) => mutate(isAucationChange, isAucationChanged, () => updateAucationApi(id, payload))
  const changeCover = (id, file) => mutate(isAucationChangeCover, isAucationChangedCover, () => changeCoverApi(id, file))
  const deleteAucation = (id) => mutate(isAucationDelete, isAucationDeleted, () => deleteAucationApi(id))
  const addBid = (id, bid) => mutate(isBidAdd, isBidAdded, () => addBidApi(id, bid))
  const deleteBid = (id) => mutate(isBidDelete, isBidDeleted, () => deleteBidApi(id))
  const deleteAllAucations = () => mutate(isAucationDeleteAll, isAucationDeletedAll, () => deleteAllAucationsApi())

  return {
    aucations, aucation, isAucation,
    isAucationAdd, isAucationAdded, isAucationChange, isAucationChanged, isAucationChangeCover,
    isAucationChangedCover, isAucationDelete, isAucationDeleted, isBidAdd, isBidAdded, isBidDelete,
    isBidDeleted, isAucationDeleteAll, isAucationDeletedAll,
    fetchAucations, fetchAucation, addAucation, changeAucation, changeCover, deleteAucation,
    addBid, deleteBid, deleteAllAucations,
  }
})
